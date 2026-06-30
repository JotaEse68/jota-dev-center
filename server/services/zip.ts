import fs from 'node:fs';
import path from 'node:path';
import archiver from 'archiver';
import type { Project } from './projects';

const EXCLUDED = [
  'node_modules',
  '.git',
  'dist',
  'build',
  '.next',
  '.vercel',
  '.netlify',
  'vendor',
  'exports',
  '.DS_Store',
];

function timestamp(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
}

export interface ZipResult {
  ok: boolean;
  message: string;
  zipPath?: string;
  exportDir?: string;
}

/**
 * Crea un ZIP del proyecto excluyendo carpetas pesadas y de build.
 * Solo soportado para proyectos Windows (acceso directo al filesystem).
 */
export async function createProjectZip(project: Project): Promise<ZipResult> {
  if (project.environment !== 'windows') {
    return { ok: false, message: 'La creación de ZIP solo está soportada para proyectos Windows.' };
  }
  if (!fs.existsSync(project.path)) {
    return { ok: false, message: `La ruta no existe: ${project.path}` };
  }

  const exportDir = path.join(project.path, 'exports');
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true });
  }

  const fileName = `${project.id}-${timestamp()}.zip`;
  const zipPath = path.join(exportDir, fileName);

  return new Promise<ZipResult>((resolve) => {
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => {
      resolve({
        ok: true,
        message: `ZIP creado (${(archive.pointer() / 1024).toFixed(0)} KB).`,
        zipPath,
        exportDir,
      });
    });

    archive.on('error', (err) => {
      resolve({ ok: false, message: `Error al crear el ZIP: ${err.message}` });
    });

    archive.pipe(output);

    archive.glob('**/*', {
      cwd: project.path,
      dot: true,
      ignore: EXCLUDED.flatMap((name) => [name, `${name}/**`, `**/${name}`, `**/${name}/**`]),
    });

    archive.finalize();
  });
}
