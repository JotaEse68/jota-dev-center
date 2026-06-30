import type { ProjectType, EnvironmentType } from './types';

export const TYPE_META: Record<ProjectType, { label: string; icon: string }> = {
  wordpress: { label: 'WordPress', icon: '🅦' },
  plugin: { label: 'Plugin', icon: '🧩' },
  react: { label: 'React', icon: '⚛️' },
  vite: { label: 'Vite', icon: '⚡' },
  next: { label: 'Next', icon: '▲' },
  app: { label: 'App', icon: '📦' },
  api: { label: 'API', icon: '🔌' },
  other: { label: 'Otro', icon: '📁' },
};

export const ENV_META: Record<EnvironmentType, { label: string; icon: string }> = {
  windows: { label: 'Windows', icon: '🪟' },
  wsl: { label: 'WSL', icon: '🐧' },
};

export interface SidebarFilter {
  key: string;
  label: string;
  match: (p: { type: ProjectType; environment: EnvironmentType; favorite: boolean }) => boolean;
}

export const SIDEBAR_FILTERS: SidebarFilter[] = [
  { key: 'all', label: 'Todos', match: () => true },
  { key: 'favorites', label: 'Favoritos', match: (p) => p.favorite },
  { key: 'windows', label: 'Windows', match: (p) => p.environment === 'windows' },
  { key: 'wsl', label: 'WSL', match: (p) => p.environment === 'wsl' },
  { key: 'wordpress', label: 'WordPress', match: (p) => p.type === 'wordpress' },
  { key: 'plugin', label: 'Plugins', match: (p) => p.type === 'plugin' },
  { key: 'react', label: 'React', match: (p) => p.type === 'react' },
  { key: 'vite', label: 'Vite', match: (p) => p.type === 'vite' },
  { key: 'next', label: 'Next', match: (p) => p.type === 'next' },
  { key: 'app', label: 'Apps', match: (p) => p.type === 'app' },
  { key: 'api', label: 'APIs', match: (p) => p.type === 'api' },
  { key: 'other', label: 'Otros', match: (p) => p.type === 'other' },
];
