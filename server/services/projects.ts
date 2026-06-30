import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// import.meta.url existe bajo tsx (ESM) pero queda vacío al bundlear a CJS (Electron),
// donde el dir de datos llega por JOTA_DATA_DIR; el guard evita un crash en ese caso.
const __moduleUrl = import.meta.url;
const __dirname = __moduleUrl ? path.dirname(fileURLToPath(__moduleUrl)) : process.cwd();

// IMPORTANTE: se resuelve en CADA llamada (no al cargar el módulo). En Electron,
// JOTA_DATA_DIR se define DESPUÉS de importar este módulo, así que capturarlo una
// sola vez al inicio daría una ruta equivocada (settings/proyectos vacíos).
function dataDir(): string {
  return process.env.JOTA_DATA_DIR
    ? path.resolve(process.env.JOTA_DATA_DIR)
    : path.resolve(__dirname, '..', '..', 'data');
}
const PROJECTS_FILE = () => path.join(dataDir(), 'projects.json');
const NOTES_FILE = () => path.join(dataDir(), 'notes.json');
const SETTINGS_FILE = () => path.join(dataDir(), 'settings.json');

export interface CustomCommand {
  label: string;
  command: string;
}

export interface Project {
  id: string;
  name: string;
  type: 'wordpress' | 'plugin' | 'react' | 'vite' | 'next' | 'app' | 'api' | 'other';
  environment: 'windows' | 'wsl';
  path: string;
  favorite: boolean;
  group?: string;
  repoUrl?: string;
  deployUrl?: string;
  localUrl?: string;
  devCommand?: string;
  buildCommand?: string;
  aiCommand?: string;
  secondaryAiCommand?: string;
  editor?: string;
  usesVercel?: boolean;
  usesSupabase?: boolean;
  supabaseUrl?: string;
  usesRender?: boolean;
  renderUrl?: string;
  usesNetlify?: boolean;
  netlifyUrl?: string;
  zipEnabled?: boolean;
  customCommands?: CustomCommand[];
}

export interface Settings {
  defaultProjectsRoot: string;
  secondaryProjectsRoot: string;
  wslProjectsRoot: string;
  defaultEditor: string;
  primaryAI: string;
  secondaryAI: string;
  defaultPort: number;
}

function readJson<T>(file: string, fallback: T): T {
  try {
    const raw = fs.readFileSync(file, 'utf-8');
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(file: string, data: unknown): void {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
}

export function getProjects(): Project[] {
  return readJson<Project[]>(PROJECTS_FILE(), []);
}

export function getProject(id: string): Project | undefined {
  return getProjects().find((p) => p.id === id);
}

export function saveProjects(projects: Project[]): void {
  writeJson(PROJECTS_FILE(), projects);
}

const EDITABLE_FIELDS: (keyof Project)[] = [
  'name',
  'type',
  'environment',
  'repoUrl',
  'deployUrl',
  'localUrl',
  'devCommand',
  'buildCommand',
  'supabaseUrl',
  'renderUrl',
  'netlifyUrl',
  'usesVercel',
  'usesSupabase',
  'usesRender',
  'usesNetlify',
  'zipEnabled',
];

export function updateProject(id: string, partial: Partial<Project>): Project | undefined {
  const projects = getProjects();
  const project = projects.find((p) => p.id === id);
  if (!project) return undefined;
  for (const key of EDITABLE_FIELDS) {
    if (key in partial) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (project as any)[key] = (partial as any)[key];
    }
  }
  saveProjects(projects);
  return project;
}

export function toggleFavorite(id: string): Project | undefined {
  const projects = getProjects();
  const project = projects.find((p) => p.id === id);
  if (!project) return undefined;
  project.favorite = !project.favorite;
  saveProjects(projects);
  return project;
}

export function getNotes(): Record<string, string> {
  return readJson<Record<string, string>>(NOTES_FILE(), {});
}

export function getNote(id: string): string {
  return getNotes()[id] ?? '';
}

export function saveNote(id: string, content: string): void {
  const notes = getNotes();
  notes[id] = content;
  writeJson(NOTES_FILE(), notes);
}

export function getSettings(): Settings {
  return readJson<Settings>(SETTINGS_FILE(), {
    defaultProjectsRoot: '',
    secondaryProjectsRoot: '',
    wslProjectsRoot: '',
    defaultEditor: 'vscode',
    primaryAI: 'claude',
    secondaryAI: 'codex',
    defaultPort: 3333,
  });
}

export function saveSettings(partial: Partial<Settings>): Settings {
  const current = getSettings();
  const merged: Settings = { ...current, ...partial };
  writeJson(SETTINGS_FILE(), merged);
  return merged;
}
