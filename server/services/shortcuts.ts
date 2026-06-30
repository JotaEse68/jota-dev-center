import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Devuelve la ruta absoluta a la raíz del proyecto Jota Dev Center.
 * Útil para que los scripts de acceso directo conozcan dónde están.
 */
export function getProjectRoot(): string {
  return path.resolve(__dirname, '..', '..');
}

/**
 * Ruta al script PowerShell que crea el acceso directo en el escritorio.
 */
export function getShortcutScriptPath(): string {
  return path.join(getProjectRoot(), 'scripts', 'create-desktop-shortcut.ps1');
}
