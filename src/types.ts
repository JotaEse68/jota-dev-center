export type ProjectType =
  | 'wordpress'
  | 'plugin'
  | 'react'
  | 'vite'
  | 'next'
  | 'app'
  | 'api'
  | 'other';

export type EnvironmentType = 'windows' | 'wsl';

export interface CustomCommand {
  label: string;
  command: string;
}

export interface Project {
  id: string;
  name: string;
  type: ProjectType;
  environment: EnvironmentType;
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

export type GitState = 'clean' | 'dirty' | 'no-git' | 'error';

export interface GitStatus {
  state: GitState;
  branch: string | null;
  changes: number;
  message?: string;
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

export interface ActionResult {
  ok: boolean;
  message: string;
  zipPath?: string;
  exportDir?: string;
}
