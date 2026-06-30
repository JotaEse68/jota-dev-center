import type { Project, GitStatus, Settings, ActionResult } from './types';

const BASE = '/api';

async function get<T>(url: string): Promise<T> {
  const res = await fetch(`${BASE}${url}`);
  if (!res.ok) throw new Error(`GET ${url} -> ${res.status}`);
  return res.json() as Promise<T>;
}

async function post<T>(url: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = (await res.json().catch(() => ({}))) as T;
  if (!res.ok) {
    const message = (data as { message?: string })?.message ?? `Error ${res.status}`;
    throw new Error(message);
  }
  return data;
}

export const api = {
  getProjects: () => get<Project[]>('/projects'),
  scan: (root?: string) =>
    post<{ ok: boolean; root: string; found: number; added: number; total: number }>('/scan', root ? { root } : {}),
  getGit: (id: string) => get<GitStatus>(`/projects/${id}/git`),
  getSettings: () => get<Settings>('/settings'),
  saveSettings: (settings: Partial<Settings>) => post<{ ok: boolean; settings: Settings }>('/settings', settings),
  getNote: (id: string) => get<{ id: string; content: string }>(`/notes/${id}`),
  saveNote: (id: string, content: string) => post<{ ok: boolean }>(`/notes/${id}`, { content }),
  toggleFavorite: (id: string) => post<{ ok: boolean; favorite: boolean }>(`/projects/${id}/favorite`),
  updateProject: (id: string, fields: Partial<Project>) =>
    post<{ ok: boolean; project: Project }>(`/projects/${id}/update`, fields),

  openTerminal: (id: string) => post<ActionResult>(`/projects/${id}/open-terminal`),
  openClaude: (id: string) => post<ActionResult>(`/projects/${id}/open-claude`),
  openCodex: (id: string) => post<ActionResult>(`/projects/${id}/open-codex`),
  openVscode: (id: string) => post<ActionResult>(`/projects/${id}/open-vscode`),
  openCursor: (id: string) => post<ActionResult>(`/projects/${id}/open-cursor`),
  openFolder: (id: string) => post<ActionResult>(`/projects/${id}/open-folder`),
  openExports: (id: string) => post<ActionResult>(`/projects/${id}/open-exports`),
  runDev: (id: string) => post<ActionResult>(`/projects/${id}/run-dev`),
  runBuild: (id: string) => post<ActionResult>(`/projects/${id}/run-build`),
  gitStatusTerminal: (id: string) => post<ActionResult>(`/projects/${id}/git-status-terminal`),
  gitPull: (id: string) => post<ActionResult>(`/projects/${id}/git-pull`),
  gitPush: (id: string) => post<ActionResult>(`/projects/${id}/git-push`),
  gitCommit: (id: string, message: string) => post<ActionResult>(`/projects/${id}/git-commit`, { message }),
  runCustom: (id: string, label: string) => post<ActionResult>(`/projects/${id}/run-custom`, { label }),
  createZip: (id: string) => post<ActionResult>(`/projects/${id}/create-zip`),

  listRepos: () => get<{ name: string; visibility: string; url: string }[]>('/github/repos'),
  cloneRepo: (repo: string) => post<{ ok: boolean; message: string; name?: string; total?: number }>('/github/clone', { repo }),
};
