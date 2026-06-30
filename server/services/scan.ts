import fs from 'node:fs';
import path from 'node:path';
import type { Project } from './projects';

/**
 * Escanea una carpeta raíz de proyectos con estructura:
 *   raíz / categoría / proyecto
 * (o raíz / proyecto, si una categoría no tiene subcarpetas).
 *
 * Devuelve proyectos detectados. Hace MERGE con los existentes por id para
 * preservar lo que el usuario haya editado (favoritos, comandos, integraciones).
 */

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // quita diacríticos combinantes
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

function listDirs(dir: string): string[] {
  try {
    return fs
      .readdirSync(dir, { withFileTypes: true })
      .filter((e) => e.isDirectory() && !e.name.startsWith('.'))
      .map((e) => e.name);
  } catch {
    return [];
  }
}

function hasFile(dir: string, name: string): boolean {
  try {
    return fs.existsSync(path.join(dir, name));
  } catch {
    return false;
  }
}

function hasAnyPhp(dir: string): boolean {
  try {
    return fs.readdirSync(dir).some((f) => f.toLowerCase().endsWith('.php'));
  } catch {
    return false;
  }
}

function detectType(name: string, group: string | undefined, dir: string): Project['type'] {
  const n = name.toLowerCase();
  const g = (group ?? '').toLowerCase();
  if (n.includes('plugin') || g.includes('plugin')) return 'plugin';
  if (hasFile(dir, 'wp-config.php') || hasFile(dir, 'style.css')) return 'wordpress';
  if (hasAnyPhp(dir)) return 'plugin';
  if (hasFile(dir, 'next.config.js') || hasFile(dir, 'next.config.mjs')) return 'next';
  if (hasFile(dir, 'vite.config.ts') || hasFile(dir, 'vite.config.js')) return 'vite';
  if (hasFile(dir, 'package.json')) return 'react';
  if (n.includes('app')) return 'app';
  if (n.includes('api')) return 'api';
  return 'other';
}

/** Lee la URL del remoto origin desde .git/config (best-effort). */
function readRepoUrl(dir: string): string {
  try {
    const cfg = fs.readFileSync(path.join(dir, '.git', 'config'), 'utf-8');
    const match = cfg.match(/\[remote "origin"\][^[]*url\s*=\s*(.+)/);
    if (match) {
      let url = match[1].trim();
      // Normaliza git@github.com:user/repo.git -> https://github.com/user/repo
      const ssh = url.match(/^git@([^:]+):(.+?)(\.git)?$/);
      if (ssh) url = `https://${ssh[1]}/${ssh[2]}`;
      else url = url.replace(/\.git$/, '');
      return url;
    }
  } catch {
    /* sin remoto */
  }
  return '';
}

function buildProject(dir: string, name: string, group: string | undefined): Project {
  const type = detectType(name, group, dir);
  const isPlugin = type === 'plugin' || type === 'wordpress';
  const id = slugify(group ? `${group}-${name}` : name) || slugify(name) || `proj-${Date.now()}`;
  return {
    id,
    name,
    type,
    environment: 'windows',
    path: dir,
    favorite: false,
    group,
    repoUrl: readRepoUrl(dir),
    deployUrl: '',
    localUrl: '',
    devCommand: hasFile(dir, 'package.json') ? 'npm run dev' : '',
    buildCommand: hasFile(dir, 'package.json') ? 'npm run build' : '',
    aiCommand: 'claude',
    secondaryAiCommand: 'codex',
    editor: 'vscode',
    usesVercel: false,
    usesSupabase: false,
    usesRender: false,
    usesNetlify: false,
    zipEnabled: isPlugin,
    customCommands: [],
  };
}

export interface ScanResult {
  root: string;
  found: number;
  added: number;
  projects: Project[];
}

/**
 * Escanea `root` y combina con `existing`.
 * Campos que el usuario puede haber editado se preservan del proyecto existente.
 */
export function scanProjects(root: string, existing: Project[]): ScanResult {
  if (!root || !fs.existsSync(root)) {
    return { root, found: 0, added: 0, projects: existing };
  }

  const detected: Project[] = [];
  for (const categoryName of listDirs(root)) {
    const categoryDir = path.join(root, categoryName);
    const children = listDirs(categoryDir);
    const looksLikeProject =
      hasFile(categoryDir, 'package.json') || hasFile(categoryDir, '.git') || hasAnyPhp(categoryDir);

    if (children.length > 0 && !looksLikeProject) {
      // Es una categoría: sus subcarpetas son proyectos.
      for (const projName of children) {
        detected.push(buildProject(path.join(categoryDir, projName), projName, categoryName));
      }
    } else {
      // La propia carpeta es un proyecto.
      detected.push(buildProject(categoryDir, categoryName, undefined));
    }
  }

  // Merge preservando ediciones del usuario.
  const byId = new Map(existing.map((p) => [p.id, p]));
  let added = 0;
  const merged: Project[] = [];
  const seen = new Set<string>();

  for (const det of detected) {
    seen.add(det.id);
    const prev = byId.get(det.id);
    if (prev) {
      merged.push({
        ...det,
        favorite: prev.favorite,
        deployUrl: prev.deployUrl || det.deployUrl,
        localUrl: prev.localUrl || det.localUrl,
        repoUrl: prev.repoUrl || det.repoUrl,
        devCommand: prev.devCommand || det.devCommand,
        buildCommand: prev.buildCommand || det.buildCommand,
        usesVercel: prev.usesVercel ?? det.usesVercel,
        usesSupabase: prev.usesSupabase ?? det.usesSupabase,
        supabaseUrl: prev.supabaseUrl,
        usesRender: prev.usesRender ?? det.usesRender,
        renderUrl: prev.renderUrl,
        usesNetlify: prev.usesNetlify ?? det.usesNetlify,
        netlifyUrl: prev.netlifyUrl,
        zipEnabled: prev.zipEnabled ?? det.zipEnabled,
        customCommands: prev.customCommands && prev.customCommands.length ? prev.customCommands : det.customCommands,
      });
    } else {
      added++;
      merged.push(det);
    }
  }

  // Proyectos antiguos no detectados ahora:
  // - Si están BAJO la raíz escaneada y su carpeta ya no existe -> se quitan (borrados/renombrados).
  // - Si están fuera de la raíz (WSL, manuales) -> se conservan.
  const rootResolved = path.resolve(root).toLowerCase();
  for (const prev of existing) {
    if (seen.has(prev.id)) continue;
    const underRoot = path.resolve(prev.path).toLowerCase().startsWith(rootResolved);
    if (underRoot && !fs.existsSync(prev.path)) continue; // carpeta borrada bajo la raíz -> fuera
    merged.push(prev);
  }

  merged.sort((a, b) => (a.group ?? '').localeCompare(b.group ?? '') || a.name.localeCompare(b.name));

  return { root, found: detected.length, added, projects: merged };
}
