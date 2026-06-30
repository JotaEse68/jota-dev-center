import { spawn, execFile } from 'node:child_process';
import { promisify } from 'node:util';
import type { Project } from './projects';
import {
  buildLaunchInvocation,
  validateProjectPath,
  wslPathToUnc,
} from './environment';

const execFileAsync = promisify(execFile);
const PLATFORM = process.platform; // 'win32' | 'darwin' | 'linux'

interface LaunchSpec {
  exe: string;
  args: string[];
  fallback?: { exe: string; args: string[] };
}

function appleScriptEscape(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

/**
 * Construye cómo abrir una terminal visible en `path` ejecutando `inner`,
 * según el sistema operativo y el entorno del proyecto.
 */
function buildSpec(project: Project, inner: string): LaunchSpec {
  // Proyectos WSL (solo en Windows): se ejecuta dentro de Ubuntu.
  if (project.environment === 'wsl') {
    const invocation = buildLaunchInvocation('wsl', project.path, inner);
    return { exe: 'pwsh', args: ['-NoProfile', '-Command', invocation], fallback: { exe: 'powershell', args: ['-NoProfile', '-Command', invocation] } };
  }

  if (PLATFORM === 'win32') {
    const invocation = buildLaunchInvocation('windows', project.path, inner);
    return { exe: 'pwsh', args: ['-NoProfile', '-Command', invocation], fallback: { exe: 'powershell', args: ['-NoProfile', '-Command', invocation] } };
  }

  if (PLATFORM === 'darwin') {
    const shellCmd = inner ? `cd '${project.path}' && ${inner}` : `cd '${project.path}'`;
    const script = `tell application "Terminal" to do script "${appleScriptEscape(shellCmd)}"`;
    return {
      exe: 'osascript',
      args: ['-e', script, '-e', 'tell application "Terminal" to activate'],
    };
  }

  // linux y otros
  const shellCmd = inner ? `cd '${project.path}' && ${inner}; exec bash` : `cd '${project.path}'; exec bash`;
  return {
    exe: 'gnome-terminal',
    args: ['--', 'bash', '-c', shellCmd],
    fallback: { exe: 'x-terminal-emulator', args: ['-e', `bash -c "${shellCmd.replace(/"/g, '\\"')}"`] },
  };
}

/**
 * Lanza una nueva terminal visible que ejecuta `innerCommand` en la carpeta del
 * proyecto. Multiplataforma (Windows/macOS/Linux). No esconde la ejecución.
 *
 * NOTA: en Windows NO se usa `detached: true` (crearía el proceso sin consola y
 * la ventana no llegaría a abrirse).
 */
export function launchTerminal(project: Project, innerCommand: string): { ok: boolean; message: string } {
  const check = validateProjectPath(project.environment, project.path);
  if (!check.ok) {
    return { ok: false, message: check.message ?? 'Ruta inválida.' };
  }

  const spec = buildSpec(project, innerCommand);

  function run(exe: string, args: string[], fb?: { exe: string; args: string[] }): boolean {
    try {
      const child = spawn(exe, args, { windowsHide: true, stdio: 'ignore' });
      child.on('error', () => {
        if (fb) {
          try {
            spawn(fb.exe, fb.args, { windowsHide: true, stdio: 'ignore' }).on('error', () => {});
          } catch {
            /* ignore */
          }
        }
      });
      child.unref();
      return true;
    } catch {
      return false;
    }
  }

  if (run(spec.exe, spec.args, spec.fallback)) {
    return { ok: true, message: 'Terminal lanzada.' };
  }
  if (spec.fallback && run(spec.fallback.exe, spec.fallback.args)) {
    return { ok: true, message: 'Terminal lanzada.' };
  }
  return { ok: false, message: 'No se pudo lanzar la terminal.' };
}

/**
 * Comprueba si un comando existe en el PATH del entorno indicado.
 */
export async function commandExists(environment: 'windows' | 'wsl', command: string): Promise<boolean> {
  try {
    if (environment === 'wsl') {
      await execFileAsync('wsl', ['-e', 'bash', '-lc', `command -v ${command}`]);
      return true;
    }
    if (PLATFORM === 'win32') {
      await execFileAsync('pwsh', [
        '-NoProfile',
        '-Command',
        `if (Get-Command '${command.replace(/'/g, "''")}' -ErrorAction SilentlyContinue) { exit 0 } else { exit 1 }`,
      ]);
      return true;
    }
    // macOS / Linux
    await execFileAsync('sh', ['-c', `command -v ${command}`]);
    return true;
  } catch {
    return false;
  }
}

/**
 * Abre la carpeta del proyecto en el explorador de archivos del sistema.
 */
export function openFolder(project: Project, subPath?: string): { ok: boolean; message: string } {
  const check = validateProjectPath(project.environment, project.path);
  if (!check.ok) {
    return { ok: false, message: check.message ?? 'Ruta inválida.' };
  }

  let target: string;
  if (project.environment === 'wsl') {
    target = wslPathToUnc(project.path);
    if (subPath) target = `${target}\\${subPath}`;
  } else if (PLATFORM === 'win32') {
    target = subPath ? `${project.path}\\${subPath}` : project.path;
  } else {
    target = subPath ? `${project.path}/${subPath}` : project.path;
  }

  const opener = PLATFORM === 'win32' ? 'explorer.exe' : PLATFORM === 'darwin' ? 'open' : 'xdg-open';

  try {
    const child = spawn(opener, [target], { windowsHide: true, stdio: 'ignore' });
    child.on('error', () => {});
    child.unref();
    return { ok: true, message: `Abriendo ${target}` };
  } catch (err) {
    return { ok: false, message: `No se pudo abrir la carpeta: ${(err as Error).message}` };
  }
}
