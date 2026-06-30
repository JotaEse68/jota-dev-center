import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs';
import path from 'node:path';
import { commandExists } from './commands';

const execFileAsync = promisify(execFile);

export interface RepoInfo {
  name: string;
  visibility: string;
  url: string;
}

/** Lista los repos del usuario autenticado vía GitHub CLI (vacío si no hay gh). */
export async function listRepos(): Promise<RepoInfo[]> {
  if (!(await commandExists('windows', 'gh'))) return [];
  try {
    const { stdout } = await execFileAsync('gh', [
      'repo',
      'list',
      '--limit',
      '200',
      '--json',
      'name,visibility,url,pushedAt',
    ]);
    const arr = JSON.parse(stdout) as (RepoInfo & { pushedAt?: string })[];
    return arr
      .sort((a, b) => (b.pushedAt ?? '').localeCompare(a.pushedAt ?? ''))
      .map(({ name, visibility, url }) => ({ name, visibility, url }));
  } catch {
    return [];
  }
}

function parseRepo(input: string): { name: string; httpsUrl: string; ghArg: string } {
  const s = input.trim();
  const urlMatch = s.match(/github\.com[/:]([^/]+)\/([^/\s.]+)(?:\.git)?\/?$/i);
  if (urlMatch) {
    return {
      name: urlMatch[2],
      httpsUrl: `https://github.com/${urlMatch[1]}/${urlMatch[2]}.git`,
      ghArg: `${urlMatch[1]}/${urlMatch[2]}`,
    };
  }
  const ownerName = s.match(/^([^/\s]+)\/([^/\s]+)$/);
  if (ownerName) {
    const name = ownerName[2].replace(/\.git$/, '');
    return {
      name,
      httpsUrl: `https://github.com/${ownerName[1]}/${name}.git`,
      ghArg: `${ownerName[1]}/${name}`,
    };
  }
  // Nombre suelto: solo funcionará vía gh (repo del usuario autenticado).
  return { name: s.replace(/\.git$/, ''), httpsUrl: '', ghArg: s };
}

export interface CloneResult {
  ok: boolean;
  message: string;
  name?: string;
}

/**
 * Clona un repo (URL completa o `owner/name` o nombre) dentro de
 * `<root>/GitHub Repos/`. Usa GitHub CLI si está disponible (soporta privados),
 * y si no, `git clone` por HTTPS.
 */
export async function cloneRepo(input: string, root: string): Promise<CloneResult> {
  if (!input || !input.trim()) return { ok: false, message: 'Indica un repo (URL o owner/nombre).' };
  if (!root || !fs.existsSync(root)) return { ok: false, message: `La carpeta raíz no existe: ${root}` };

  const { name, httpsUrl, ghArg } = parseRepo(input);
  if (!name) return { ok: false, message: 'No se pudo interpretar el repo.' };

  const dest = path.join(root, 'GitHub Repos');
  fs.mkdirSync(dest, { recursive: true });
  const target = path.join(dest, name);
  if (fs.existsSync(target)) return { ok: false, message: `Ya existe una carpeta "${name}" en GitHub Repos.` };

  if (await commandExists('windows', 'gh')) {
    try {
      await execFileAsync('gh', ['repo', 'clone', ghArg, target]);
      return { ok: true, message: `Clonado: ${name}`, name };
    } catch {
      /* probamos git clone */
    }
  }
  if (httpsUrl) {
    try {
      await execFileAsync('git', ['clone', httpsUrl, target]);
      return { ok: true, message: `Clonado: ${name}`, name };
    } catch (err) {
      return { ok: false, message: `No se pudo clonar: ${(err as Error).message}` };
    }
  }
  return {
    ok: false,
    message: 'No se pudo clonar. Instala GitHub CLI (gh) o usa la URL completa del repo.',
  };
}
