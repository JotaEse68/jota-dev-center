import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import type { Project } from './projects';
import { validateProjectPath } from './environment';

const execFileAsync = promisify(execFile);

export type GitState = 'clean' | 'dirty' | 'no-git' | 'error';

export interface GitStatus {
  state: GitState;
  branch: string | null;
  changes: number;
  message?: string;
}

/**
 * Ejecuta un comando git capturando la salida.
 * - Windows: git directamente.
 * - WSL: git a través de `wsl -e bash -lc "cd RUTA && git ..."`.
 */
async function runGit(project: Project, args: string[]): Promise<{ stdout: string; stderr: string }> {
  if (project.environment === 'wsl') {
    const gitCmd = `git ${args.join(' ')}`;
    const bash = `cd "${project.path}" && ${gitCmd}`;
    return execFileAsync('wsl', ['-e', 'bash', '-lc', bash]);
  }
  return execFileAsync('git', args, { cwd: project.path });
}

export async function getGitStatus(project: Project): Promise<GitStatus> {
  const check = validateProjectPath(project.environment, project.path);
  if (!check.ok) {
    return { state: 'error', branch: null, changes: 0, message: check.message };
  }

  try {
    // ¿Es un repositorio git?
    await runGit(project, ['rev-parse', '--is-inside-work-tree']);
  } catch {
    return { state: 'no-git', branch: null, changes: 0 };
  }

  try {
    const [{ stdout: porcelain }, branchResult] = await Promise.all([
      runGit(project, ['status', '--porcelain']),
      runGit(project, ['branch', '--show-current']).catch(() => ({ stdout: '' })),
    ]);

    const changedLines = porcelain.split('\n').filter((l) => l.trim().length > 0);
    const branch = branchResult.stdout.trim() || null;

    return {
      state: changedLines.length === 0 ? 'clean' : 'dirty',
      branch,
      changes: changedLines.length,
    };
  } catch (err) {
    return { state: 'error', branch: null, changes: 0, message: (err as Error).message };
  }
}
