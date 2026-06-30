import fs from 'node:fs';

export type Environment = 'windows' | 'wsl';

/**
 * Escapa una cadena para incluirla dentro de una cadena PowerShell entre comillas simples.
 * En PowerShell las comillas simples se escapan duplicándolas.
 */
export function psEscapeSingle(value: string): string {
  return value.replace(/'/g, "''");
}

/**
 * Valida que la ruta del proyecto existe.
 * - Windows: comprobación directa en el sistema de ficheros.
 * - WSL: no se puede comprobar de forma fiable desde Node en Windows, así que
 *   solo validamos que tenga forma de ruta absoluta de Linux.
 */
export function validateProjectPath(environment: Environment, projectPath: string): { ok: boolean; message?: string } {
  if (!projectPath || !projectPath.trim()) {
    return { ok: false, message: 'La ruta del proyecto está vacía.' };
  }

  if (environment === 'wsl') {
    if (!projectPath.startsWith('/')) {
      return { ok: false, message: `La ruta WSL no parece válida: ${projectPath}` };
    }
    return { ok: true };
  }

  // windows
  if (!fs.existsSync(projectPath)) {
    return { ok: false, message: `La ruta no existe: ${projectPath}` };
  }
  return { ok: true };
}

/**
 * Construye la invocación de PowerShell que abre una NUEVA ventana de terminal
 * visible, posicionada en la carpeta del proyecto y ejecutando `innerCommand`.
 *
 * Devuelve el comando completo que se pasará a `pwsh -NoProfile -Command "..."`.
 *
 * Windows:
 *   Start-Process pwsh -ArgumentList '-NoExit','-Command','cd ''RUTA''; COMANDO'
 *
 * WSL:
 *   Start-Process pwsh -ArgumentList '-NoExit','-Command','wsl -e bash -lc ''cd RUTA && COMANDO'''
 */
export function buildLaunchInvocation(
  environment: Environment,
  projectPath: string,
  innerCommand: string,
): string {
  if (environment === 'wsl') {
    // Comando que se ejecuta dentro de bash en WSL.
    const bashCommand = innerCommand
      ? `cd "${projectPath}" && ${innerCommand}`
      : `cd "${projectPath}" && exec bash`;
    // wsl -e bash -lc 'BASHCOMMAND' — usamos comillas simples para bash.
    const wslPayload = `wsl -e bash -lc '${bashCommand.replace(/'/g, "'\\''")}'`;
    return `Start-Process pwsh -ArgumentList '-NoExit','-Command','${psEscapeSingle(wslPayload)}'`;
  }

  // windows
  const psPayload = innerCommand ? `cd '${projectPath}'; ${innerCommand}` : `cd '${projectPath}'`;
  return `Start-Process pwsh -ArgumentList '-NoExit','-Command','${psEscapeSingle(psPayload)}'`;
}

/**
 * Convierte una ruta WSL (/home/jota/...) a su equivalente UNC accesible desde el
 * Explorador de Windows: \\wsl.localhost\<distro>\home\jota\...
 */
export function wslPathToUnc(projectPath: string, distro = 'Ubuntu'): string {
  const windowsified = projectPath.replace(/\//g, '\\');
  return `\\\\wsl.localhost\\${distro}${windowsified}`;
}
