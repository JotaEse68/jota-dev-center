import { spawn, execFile } from 'node:child_process';
import { promisify } from 'node:util';
import type { Project } from './projects';
import {
  buildLaunchInvocation,
  validateProjectPath,
  wslPathToUnc,
} from './environment';

const execFileAsync = promisify(execFile);

/**
 * Lanza una nueva ventana de terminal (pwsh) visible que ejecuta `innerCommand`
 * en la carpeta del proyecto. Para WSL, el comando se ejecuta dentro de bash.
 *
 * No esconde la ejecución: el usuario ve siempre una terminal con feedback.
 */
export function launchTerminal(project: Project, innerCommand: string): { ok: boolean; message: string } {
  const check = validateProjectPath(project.environment, project.path);
  if (!check.ok) {
    return { ok: false, message: check.message ?? 'Ruta inválida.' };
  }

  const invocation = buildLaunchInvocation(project.environment, project.path, innerCommand);

  // IMPORTANTE: NO usar `detached: true` en Windows. Crea el proceso sin consola
  // (DETACHED_PROCESS) y entonces el `Start-Process` interno no llega a abrir la
  // ventana visible. Con windowsHide se oculta solo el lanzador; la ventana de la
  // terminal la abre Start-Process y sí se ve.
  function launch(exe: string): boolean {
    try {
      const child = spawn(exe, ['-NoProfile', '-Command', invocation], {
        windowsHide: true,
        stdio: 'ignore',
      });
      // Si el ejecutable no existe, el error llega de forma asíncrona: probamos powershell.
      child.on('error', () => {
        if (exe === 'pwsh') {
          try {
            spawn('powershell', ['-NoProfile', '-Command', invocation], {
              windowsHide: true,
              stdio: 'ignore',
            }).on('error', () => {});
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

  if (launch('pwsh')) {
    return { ok: true, message: 'Terminal lanzada.' };
  }
  if (launch('powershell')) {
    return { ok: true, message: 'Terminal lanzada (powershell).' };
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
    await execFileAsync('pwsh', [
      '-NoProfile',
      '-Command',
      `if (Get-Command '${command.replace(/'/g, "''")}' -ErrorAction SilentlyContinue) { exit 0 } else { exit 1 }`,
    ]);
    return true;
  } catch {
    return false;
  }
}

/**
 * Abre la carpeta del proyecto en el Explorador de Windows.
 * Para WSL usa la ruta UNC \\wsl.localhost\...
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
  } else {
    target = subPath ? `${project.path}\\${subPath}` : project.path;
  }

  try {
    const child = spawn('explorer.exe', [target], { windowsHide: true, stdio: 'ignore' });
    child.on('error', () => {});
    child.unref();
    return { ok: true, message: `Abriendo ${target}` };
  } catch (err) {
    return { ok: false, message: `No se pudo abrir la carpeta: ${(err as Error).message}` };
  }
}
