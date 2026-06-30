import express, { type Express, type Request, type Response } from 'express';
import http from 'node:http';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

import {
  getProjects,
  getProject,
  toggleFavorite,
  saveProjects,
  updateProject,
  getNote,
  saveNote,
  getSettings,
  saveSettings,
  type Project,
} from './services/projects';
import { getGitStatus } from './services/git';
import { launchTerminal, commandExists, openFolder } from './services/commands';
import { createProjectZip } from './services/zip';
import { scanProjects } from './services/scan';
import { listRepos, cloneRepo } from './services/github';

// import.meta.url queda vacío al bundlear a CJS (Electron), donde staticDir se pasa
// explícito; el guard evita un crash de fileURLToPath en ese caso.
const __moduleUrl = import.meta.url;
const __dirname = __moduleUrl ? path.dirname(fileURLToPath(__moduleUrl)) : process.cwd();
const ROOT = path.resolve(__dirname, '..');

const isProd = process.env.NODE_ENV === 'production';
const DEFAULT_PORT = Number(process.env.PORT) || (isProd ? 3333 : 3334);

// --- Helper para localizar un proyecto o devolver 404 ---
function requireProject(req: Request, res: Response): Project | null {
  const project = getProject(req.params.id);
  if (!project) {
    res.status(404).json({ ok: false, message: `Proyecto no encontrado: ${req.params.id}` });
    return null;
  }
  return project;
}

/**
 * Construye la aplicación Express con todas las rutas de la API.
 * `serveStatic` añade el servicio del frontend compilado (dist/).
 */
export function createApp(opts: { serveStatic?: boolean; staticDir?: string } = {}): Express {
  const app = express();
  app.use(express.json());

  // CORS abierto solo en desarrollo (frontend en 3333, backend en 3334).
  if (!isProd) {
    app.use((_req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type');
      next();
    });
  }

  // ============================ PROYECTOS ============================

  app.get('/api/projects', (_req, res) => {
    res.json(getProjects());
  });

  app.post('/api/projects/:id/favorite', (req, res) => {
    const project = toggleFavorite(req.params.id);
    if (!project) {
      res.status(404).json({ ok: false, message: 'Proyecto no encontrado.' });
      return;
    }
    res.json({ ok: true, favorite: project.favorite });
  });

  app.post('/api/projects/:id/update', (req, res) => {
    const updated = updateProject(req.params.id, (req.body ?? {}) as Partial<Project>);
    if (!updated) {
      res.status(404).json({ ok: false, message: 'Proyecto no encontrado.' });
      return;
    }
    res.json({ ok: true, project: updated });
  });

  app.get('/api/projects/:id/git', async (req, res) => {
    const project = requireProject(req, res);
    if (!project) return;
    const status = await getGitStatus(project);
    res.json(status);
  });

  // ----- Acciones que abren una terminal visible -----

  app.post('/api/projects/:id/open-terminal', (req, res) => {
    const project = requireProject(req, res);
    if (!project) return;
    res.json(launchTerminal(project, ''));
  });

  app.post('/api/projects/:id/open-claude', async (req, res) => {
    const project = requireProject(req, res);
    if (!project) return;
    const cmd = project.aiCommand || 'claude';
    if (!(await commandExists(project.environment, cmd))) {
      res.status(400).json({ ok: false, message: `'${cmd}' no está en el PATH (${project.environment}).` });
      return;
    }
    res.json(launchTerminal(project, cmd));
  });

  app.post('/api/projects/:id/open-codex', async (req, res) => {
    const project = requireProject(req, res);
    if (!project) return;
    const cmd = project.secondaryAiCommand || 'codex';
    if (!(await commandExists(project.environment, cmd))) {
      res.status(400).json({ ok: false, message: `'${cmd}' no está en el PATH (${project.environment}).` });
      return;
    }
    res.json(launchTerminal(project, cmd));
  });

  app.post('/api/projects/:id/open-vscode', async (req, res) => {
    const project = requireProject(req, res);
    if (!project) return;
    if (!(await commandExists(project.environment, 'code'))) {
      res.status(400).json({ ok: false, message: "'code' no está en el PATH. Instala VS Code o habilita el comando 'code'." });
      return;
    }
    res.json(launchTerminal(project, 'code .'));
  });

  app.post('/api/projects/:id/open-cursor', async (req, res) => {
    const project = requireProject(req, res);
    if (!project) return;
    if (!(await commandExists(project.environment, 'cursor'))) {
      res.status(400).json({ ok: false, message: "'cursor' no está en el PATH. Instala Cursor o habilita el comando 'cursor'." });
      return;
    }
    res.json(launchTerminal(project, 'cursor .'));
  });

  app.post('/api/projects/:id/open-folder', (req, res) => {
    const project = requireProject(req, res);
    if (!project) return;
    res.json(openFolder(project));
  });

  app.post('/api/projects/:id/open-exports', (req, res) => {
    const project = requireProject(req, res);
    if (!project) return;
    res.json(openFolder(project, 'exports'));
  });

  app.post('/api/projects/:id/run-dev', (req, res) => {
    const project = requireProject(req, res);
    if (!project) return;
    const cmd = project.devCommand || 'npm run dev';
    res.json(launchTerminal(project, cmd));
  });

  app.post('/api/projects/:id/run-build', (req, res) => {
    const project = requireProject(req, res);
    if (!project) return;
    const cmd = project.buildCommand || 'npm run build';
    res.json(launchTerminal(project, cmd));
  });

  // ----- Git: status visible, pull, push, commit -----

  app.post('/api/projects/:id/git-status-terminal', (req, res) => {
    const project = requireProject(req, res);
    if (!project) return;
    res.json(launchTerminal(project, 'git status'));
  });

  app.post('/api/projects/:id/git-pull', (req, res) => {
    const project = requireProject(req, res);
    if (!project) return;
    res.json(launchTerminal(project, 'git pull'));
  });

  app.post('/api/projects/:id/git-push', (req, res) => {
    const project = requireProject(req, res);
    if (!project) return;
    // La confirmación se realiza en el frontend antes de llamar a este endpoint.
    res.json(launchTerminal(project, 'git push'));
  });

  app.post('/api/projects/:id/git-commit', (req, res) => {
    const project = requireProject(req, res);
    if (!project) return;
    const message = String(req.body?.message ?? '').trim();
    if (!message) {
      res.status(400).json({ ok: false, message: 'El mensaje de commit es obligatorio.' });
      return;
    }
    // Usamos comillas SIMPLES de PowerShell (sin interpolación) y escapamos las
    // comillas simples del mensaje duplicándolas. Esto neutraliza $(...), backticks
    // y `;` dentro del mensaje, evitando inyección de comandos.
    const safeMessage = message.replace(/'/g, "''");
    res.json(launchTerminal(project, `git add .; git commit -m '${safeMessage}'`));
  });

  // ----- Comandos personalizados (solo los definidos en projects.json) -----

  app.post('/api/projects/:id/run-custom', (req, res) => {
    const project = requireProject(req, res);
    if (!project) return;
    const label = String(req.body?.label ?? '');
    const custom = (project.customCommands || []).find((c) => c.label === label);
    if (!custom) {
      res.status(400).json({ ok: false, message: 'Comando no permitido. Solo se ejecutan comandos definidos en projects.json.' });
      return;
    }
    res.json(launchTerminal(project, custom.command));
  });

  // ----- ZIP -----

  app.post('/api/projects/:id/create-zip', async (req, res) => {
    const project = requireProject(req, res);
    if (!project) return;
    if (!project.zipEnabled) {
      res.status(400).json({ ok: false, message: 'Este proyecto no tiene la creación de ZIP habilitada.' });
      return;
    }
    const result = await createProjectZip(project);
    res.json(result);
  });

  // ============================ NOTAS ============================

  app.get('/api/notes/:id', (req, res) => {
    res.json({ id: req.params.id, content: getNote(req.params.id) });
  });

  app.post('/api/notes/:id', (req, res) => {
    const content = String(req.body?.content ?? '');
    saveNote(req.params.id, content);
    res.json({ ok: true });
  });

  // ============================ AJUSTES ============================

  app.get('/api/settings', (_req, res) => {
    res.json(getSettings());
  });

  app.post('/api/settings', (req, res) => {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const allowed = [
      'defaultProjectsRoot',
      'secondaryProjectsRoot',
      'wslProjectsRoot',
      'defaultEditor',
      'primaryAI',
      'secondaryAI',
      'defaultPort',
    ];
    const partial: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in body) partial[key] = body[key];
    }
    const saved = saveSettings(partial as Parameters<typeof saveSettings>[0]);
    res.json({ ok: true, settings: saved });
  });

  // ============================ ESCANEO DE PROYECTOS ============================

  // Recorre la carpeta raíz (settings.defaultProjectsRoot o body.root) y combina
  // los proyectos detectados con los existentes, preservando ediciones del usuario.
  app.post('/api/scan', (req, res) => {
    const root = String(req.body?.root ?? '').trim() || getSettings().defaultProjectsRoot;
    if (!root) {
      res.status(400).json({ ok: false, message: 'No hay carpeta raíz configurada (defaultProjectsRoot).' });
      return;
    }
    if (!fs.existsSync(root)) {
      res.status(400).json({ ok: false, message: `La carpeta raíz no existe: ${root}` });
      return;
    }
    const result = scanProjects(root, getProjects());
    saveProjects(result.projects);
    res.json({ ok: true, root: result.root, found: result.found, added: result.added, total: result.projects.length });
  });

  // ============================ GITHUB (clonar) ============================

  app.get('/api/github/repos', async (_req, res) => {
    res.json(await listRepos());
  });

  app.post('/api/github/clone', async (req, res) => {
    const repo = String(req.body?.repo ?? '').trim();
    const root = getSettings().defaultProjectsRoot;
    const result = await cloneRepo(repo, root);
    if (!result.ok) {
      res.status(400).json(result);
      return;
    }
    // Re-escanea para que el repo clonado aparezca como proyecto.
    const scan = scanProjects(root, getProjects());
    saveProjects(scan.projects);
    res.json({ ...result, total: scan.projects.length });
  });

  // ============================ ESTÁTICOS (frontend compilado) ============================

  if (opts.serveStatic) {
    const distDir = opts.staticDir ?? path.join(ROOT, 'dist');
    if (fs.existsSync(distDir)) {
      app.use(express.static(distDir));
      app.get('*', (_req, res) => {
        res.sendFile(path.join(distDir, 'index.html'));
      });
    } else {
      console.warn(`[Jota Dev Center] No existe dist/ en ${distDir}. Ejecuta "npm run build".`);
    }
  }

  return app;
}

export interface StartOptions {
  port?: number;
  serveStatic?: boolean;
  staticDir?: string;
}

/**
 * Arranca el servidor HTTP. Devuelve el servidor y el puerto real asignado
 * (útil cuando se pasa port=0 para que el SO elija uno libre, como en Electron).
 */
export function startServer(opts: StartOptions = {}): Promise<{ server: http.Server; port: number }> {
  const app = createApp({ serveStatic: opts.serveStatic, staticDir: opts.staticDir });
  const port = opts.port ?? DEFAULT_PORT;
  return new Promise((resolve) => {
    const server = app.listen(port, '127.0.0.1', () => {
      const addr = server.address();
      const realPort = typeof addr === 'object' && addr ? addr.port : port;
      resolve({ server, port: realPort });
    });
  });
}

// Arranque directo SOLO desde la CLI: los scripts npm definen JOTA_CLI=1.
// Electron importa startServer y NUNCA define JOTA_CLI, por lo que importar este
// módulo no abre ningún puerto (evita el doble arranque / EADDRINUSE).
if (process.env.JOTA_CLI === '1') {
  startServer({ port: DEFAULT_PORT, serveStatic: isProd }).then(({ port }) => {
    if (isProd) {
      console.log(`\n  Jota Dev Center  ->  http://localhost:${port}\n`);
    } else {
      console.log(`[Jota Dev Center] API de desarrollo en http://127.0.0.1:${port} (frontend en http://localhost:3333)`);
    }
  });
}
