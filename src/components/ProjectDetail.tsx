import { useState } from 'react';
import type { Project, GitStatus, ProjectType } from '../types';
import { TYPE_META, ENV_META } from '../meta';
import { api } from '../api';
import StatusBadge from './StatusBadge';
import CommandButton from './CommandButton';
import NotesPanel from './NotesPanel';

interface Props {
  project: Project;
  git?: GitStatus | null;
  gitLoading?: boolean;
  onToggleFavorite: () => void;
  onRefreshGit: () => void;
  onUpdated?: () => void;
}

const SENSITIVE = /remove-item|rm\s|rmdir|del\s|format|reset --hard|clean -|drop\s/i;
const TYPES: ProjectType[] = ['wordpress', 'plugin', 'react', 'vite', 'next', 'app', 'api', 'other'];
const AI_PRESETS = ['claude', 'codex', 'cursor', 'gemini', 'aider', 'cline', 'continue', 'opencode'];

function aiLabel(cmd: string | undefined): string {
  const c = (cmd || '').toLowerCase();
  if (!c || c === 'claude') return 'Claude Code';
  if (c === 'codex') return 'Codex';
  if (c === 'cursor') return 'Cursor';
  if (c === 'gemini') return 'Gemini';
  if (c === 'aider') return 'Aider';
  return cmd as string;
}

function openLink(url?: string) {
  if (url) window.open(url, '_blank', 'noopener');
}

type EditForm = {
  name: string;
  type: ProjectType;
  environment: 'windows' | 'wsl';
  aiCommand: string;
  secondaryAiCommand: string;
  repoUrl: string;
  deployUrl: string;
  netlifyUrl: string;
  supabaseUrl: string;
  renderUrl: string;
  localUrl: string;
  devCommand: string;
  buildCommand: string;
  zipEnabled: boolean;
};

function formFromProject(p: Project): EditForm {
  return {
    name: p.name,
    type: p.type,
    environment: p.environment,
    aiCommand: p.aiCommand ?? 'claude',
    secondaryAiCommand: p.secondaryAiCommand ?? 'codex',
    repoUrl: p.repoUrl ?? '',
    deployUrl: p.deployUrl ?? '',
    netlifyUrl: p.netlifyUrl ?? '',
    supabaseUrl: p.supabaseUrl ?? '',
    renderUrl: p.renderUrl ?? '',
    localUrl: p.localUrl ?? '',
    devCommand: p.devCommand ?? '',
    buildCommand: p.buildCommand ?? '',
    zipEnabled: !!p.zipEnabled,
  };
}

export default function ProjectDetail({ project, git, gitLoading, onToggleFavorite, onRefreshGit, onUpdated }: Props) {
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null);
  const [showCommit, setShowCommit] = useState(false);
  const [commitMsg, setCommitMsg] = useState('');
  const [committing, setCommitting] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [form, setForm] = useState<EditForm>(() => formFromProject(project));
  const [saving, setSaving] = useState(false);

  const type = TYPE_META[project.type];
  const env = ENV_META[project.environment];

  function report(ok: boolean, message: string) {
    setFeedback({ ok, message });
  }

  function openEdit() {
    setForm(formFromProject(project));
    setShowEdit(true);
  }

  async function saveEdit() {
    setSaving(true);
    try {
      await api.updateProject(project.id, {
        name: form.name.trim() || project.name,
        type: form.type,
        environment: form.environment,
        aiCommand: form.aiCommand.trim() || 'claude',
        secondaryAiCommand: form.secondaryAiCommand.trim() || 'codex',
        repoUrl: form.repoUrl.trim(),
        deployUrl: form.deployUrl.trim(),
        netlifyUrl: form.netlifyUrl.trim(),
        supabaseUrl: form.supabaseUrl.trim(),
        renderUrl: form.renderUrl.trim(),
        localUrl: form.localUrl.trim(),
        devCommand: form.devCommand.trim(),
        buildCommand: form.buildCommand.trim(),
        zipEnabled: form.zipEnabled,
        usesVercel: !!form.deployUrl.trim(),
        usesNetlify: !!form.netlifyUrl.trim(),
        usesSupabase: !!form.supabaseUrl.trim(),
        usesRender: !!form.renderUrl.trim(),
      });
      setShowEdit(false);
      report(true, 'Proyecto actualizado.');
      onUpdated?.();
    } catch (err) {
      report(false, (err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function doCommit() {
    if (!commitMsg.trim()) return;
    setCommitting(true);
    try {
      const res = await api.gitCommit(project.id, commitMsg.trim());
      report(res.ok, res.message);
      setShowCommit(false);
      setCommitMsg('');
      setTimeout(onRefreshGit, 1500);
    } catch (err) {
      report(false, (err as Error).message);
    } finally {
      setCommitting(false);
    }
  }

  async function doPush() {
    if (!window.confirm('¿Hacer git push de este proyecto?')) return;
    try {
      const res = await api.gitPush(project.id);
      report(res.ok, res.message);
    } catch (err) {
      report(false, (err as Error).message);
    }
  }

  async function runCustom(label: string, command: string) {
    if (SENSITIVE.test(command) && !window.confirm(`Este comando puede ser sensible:\n\n${command}\n\n¿Ejecutar?`)) {
      return;
    }
    try {
      const res = await api.runCustom(project.id, label);
      report(res.ok, res.message);
    } catch (err) {
      report(false, (err as Error).message);
    }
  }

  const hasIntegrations =
    project.repoUrl || project.deployUrl || project.netlifyUrl || project.supabaseUrl || project.renderUrl;

  return (
    <div className="detail">
      <header className="detail-header">
        <div className="detail-title">
          <span className="type-icon big">{type.icon}</span>
          <div>
            <h2>{project.name}</h2>
            <div className="detail-sub">
              <span className="badge badge-type">{type.label}</span>
              <span className={`badge badge-env env-${project.environment}`}>
                {env.icon} {env.label}
              </span>
              {project.group ? <span className="badge badge-type">{project.group}</span> : null}
              <StatusBadge status={git} loading={gitLoading} />
              <button type="button" className="link-btn" onClick={onRefreshGit}>
                ↻ git
              </button>
              <button type="button" className="link-btn" onClick={openEdit}>
                ✎ editar
              </button>
            </div>
          </div>
        </div>
        <button
          type="button"
          className={`fav-btn big ${project.favorite ? 'on' : ''}`}
          onClick={onToggleFavorite}
          title={project.favorite ? 'Quitar de favoritos' : 'Marcar favorito'}
        >
          {project.favorite ? '★' : '☆'}
        </button>
      </header>

      <div className="detail-path" title={project.path}>
        📂 {project.path}
      </div>

      {feedback ? (
        <div className={`alert ${feedback.ok ? 'alert-ok' : 'alert-error'}`}>
          {feedback.message}
          <button type="button" className="alert-close" onClick={() => setFeedback(null)}>
            ×
          </button>
        </div>
      ) : null}

      {/* Acciones IA destacadas */}
      <section className="action-section">
        <h4>Inteligencia artificial</h4>
        <div className="action-row">
          <CommandButton
            label={aiLabel(project.aiCommand)}
            icon="✦"
            variant="primary"
            title={`Abrir '${project.aiCommand || 'claude'}' en la carpeta`}
            onRun={() => api.openClaude(project.id)}
            onResult={report}
          />
          <CommandButton
            label={aiLabel(project.secondaryAiCommand)}
            icon="◆"
            variant="secondary"
            title={`Abrir '${project.secondaryAiCommand || 'codex'}' en la carpeta`}
            onRun={() => api.openCodex(project.id)}
            onResult={report}
          />
        </div>
      </section>

      {/* Entorno / editores */}
      <section className="action-section">
        <h4>Entorno</h4>
        <div className="action-row">
          <CommandButton label="PowerShell" icon="⌨" onRun={() => api.openTerminal(project.id)} onResult={report} />
          <CommandButton label="VS Code" icon="🆚" onRun={() => api.openVscode(project.id)} onResult={report} />
          <CommandButton label="Cursor" icon="⌖" onRun={() => api.openCursor(project.id)} onResult={report} />
          <CommandButton label="Explorer" icon="📁" onRun={() => api.openFolder(project.id)} onResult={report} />
        </div>
      </section>

      {/* Dev / build */}
      <section className="action-section">
        <h4>Ejecución</h4>
        <div className="action-row">
          <CommandButton
            label={project.devCommand || 'npm run dev'}
            icon="▶"
            variant="ghost"
            onRun={() => api.runDev(project.id)}
            onResult={report}
          />
          <CommandButton
            label={project.buildCommand || 'npm run build'}
            icon="🛠"
            variant="ghost"
            onRun={() => api.runBuild(project.id)}
            onResult={report}
          />
          {project.localUrl ? (
            <button type="button" className="cmd-btn cmd-ghost" onClick={() => openLink(project.localUrl)}>
              <span className="cmd-icon">🌐</span> URL local
            </button>
          ) : null}
        </div>
      </section>

      {/* Git */}
      <section className="action-section">
        <h4>Git</h4>
        <div className="action-row">
          <CommandButton label="git status" icon="🔍" variant="git" onRun={() => api.gitStatusTerminal(project.id)} onResult={report} />
          <CommandButton label="git pull" icon="⬇" variant="git" onRun={() => api.gitPull(project.id)} onResult={report} />
          <button type="button" className="cmd-btn cmd-git" onClick={doPush}>
            <span className="cmd-icon">⬆</span> git push
          </button>
          <button type="button" className="cmd-btn cmd-git" onClick={() => setShowCommit(true)}>
            <span className="cmd-icon">✎</span> git commit
          </button>
        </div>
      </section>

      {/* Enlaces / despliegue (se muestran según la URL configurada) */}
      <section className="action-section">
        <h4>Despliegue e integraciones</h4>
        {hasIntegrations ? (
          <div className="action-row">
            {project.repoUrl ? (
              <button type="button" className="cmd-btn cmd-ghost" onClick={() => openLink(project.repoUrl)}>
                <span className="cmd-icon"></span> GitHub
              </button>
            ) : null}
            {project.deployUrl ? (
              <button type="button" className="cmd-btn cmd-ghost" onClick={() => openLink(project.deployUrl)}>
                <span className="cmd-icon">▲</span> Vercel
              </button>
            ) : null}
            {project.netlifyUrl ? (
              <button type="button" className="cmd-btn cmd-ghost" onClick={() => openLink(project.netlifyUrl)}>
                <span className="cmd-icon">🔷</span> Netlify
              </button>
            ) : null}
            {project.supabaseUrl ? (
              <button type="button" className="cmd-btn cmd-ghost" onClick={() => openLink(project.supabaseUrl)}>
                <span className="cmd-icon">⚡</span> Supabase
              </button>
            ) : null}
            {project.renderUrl ? (
              <button type="button" className="cmd-btn cmd-ghost" onClick={() => openLink(project.renderUrl)}>
                <span className="cmd-icon">🟣</span> Render
              </button>
            ) : null}
          </div>
        ) : (
          <p className="muted">
            Sin enlaces todavía. Pulsa <strong>✎ editar</strong> (arriba) y pega la URL de GitHub, Vercel o Netlify.
          </p>
        )}
      </section>

      {/* ZIP */}
      {project.zipEnabled ? (
        <section className="action-section">
          <h4>Empaquetado</h4>
          <div className="action-row">
            <CommandButton
              label="Crear ZIP"
              icon="🗜"
              variant="secondary"
              onRun={() => api.createZip(project.id)}
              onResult={report}
            />
            <CommandButton label="Abrir carpeta exports" icon="📦" onRun={() => api.openExports(project.id)} onResult={report} />
          </div>
        </section>
      ) : null}

      {/* Comandos personalizados */}
      {project.customCommands && project.customCommands.length > 0 ? (
        <section className="action-section">
          <h4>Comandos personalizados</h4>
          <div className="action-row">
            {project.customCommands.map((c) => (
              <button
                key={c.label}
                type="button"
                className="cmd-btn cmd-ghost"
                title={c.command}
                onClick={() => runCustom(c.label, c.command)}
              >
                <span className="cmd-icon">⚙</span> {c.label}
              </button>
            ))}
          </div>
        </section>
      ) : null}

      <section className="action-section">
        <NotesPanel projectId={project.id} onResult={report} />
      </section>

      {/* Modal de commit */}
      {showCommit ? (
        <div className="modal-overlay" onClick={() => setShowCommit(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Commit en {project.name}</h3>
            <p className="muted">
              Se ejecutará <code>git add .</code> y <code>git commit -m "…"</code> en una terminal.
            </p>
            <textarea
              className="modal-input"
              autoFocus
              value={commitMsg}
              onChange={(e) => setCommitMsg(e.target.value)}
              placeholder="Mensaje de commit"
            />
            <div className="modal-actions">
              <button type="button" className="cmd-btn cmd-ghost" onClick={() => setShowCommit(false)}>
                Cancelar
              </button>
              <button
                type="button"
                className="cmd-btn cmd-primary"
                onClick={doCommit}
                disabled={committing || !commitMsg.trim()}
              >
                {committing ? 'Haciendo commit…' : 'Confirmar commit'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Modal de edición */}
      {showEdit ? (
        <div className="modal-overlay" onClick={() => setShowEdit(false)}>
          <div className="modal modal-wide" onClick={(e) => e.stopPropagation()}>
            <h3>Editar {project.name}</h3>
            <div className="edit-grid">
              <label>
                Nombre
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </label>
              <label>
                Tipo
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as ProjectType })}>
                  {TYPES.map((t) => (
                    <option key={t} value={t}>
                      {TYPE_META[t].label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Entorno
                <select
                  value={form.environment}
                  onChange={(e) => setForm({ ...form, environment: e.target.value as 'windows' | 'wsl' })}
                >
                  <option value="windows">Windows</option>
                  <option value="wsl">WSL</option>
                </select>
              </label>
              <label>
                IA principal (comando)
                <input
                  list="ai-presets"
                  value={form.aiCommand}
                  placeholder="claude"
                  onChange={(e) => setForm({ ...form, aiCommand: e.target.value })}
                />
              </label>
              <label>
                IA secundaria (comando)
                <input
                  list="ai-presets"
                  value={form.secondaryAiCommand}
                  placeholder="codex"
                  onChange={(e) => setForm({ ...form, secondaryAiCommand: e.target.value })}
                />
              </label>
              <datalist id="ai-presets">
                {AI_PRESETS.map((a) => (
                  <option key={a} value={a} />
                ))}
              </datalist>
              <label>
                GitHub (repo)
                <input value={form.repoUrl} placeholder="https://github.com/…" onChange={(e) => setForm({ ...form, repoUrl: e.target.value })} />
              </label>
              <label>
                Vercel (URL)
                <input value={form.deployUrl} placeholder="https://…vercel.app" onChange={(e) => setForm({ ...form, deployUrl: e.target.value })} />
              </label>
              <label>
                Netlify (URL)
                <input value={form.netlifyUrl} placeholder="https://…netlify.app" onChange={(e) => setForm({ ...form, netlifyUrl: e.target.value })} />
              </label>
              <label>
                Supabase (URL)
                <input value={form.supabaseUrl} placeholder="https://…supabase.co" onChange={(e) => setForm({ ...form, supabaseUrl: e.target.value })} />
              </label>
              <label>
                Render (URL)
                <input value={form.renderUrl} placeholder="https://…onrender.com" onChange={(e) => setForm({ ...form, renderUrl: e.target.value })} />
              </label>
              <label>
                URL local
                <input value={form.localUrl} placeholder="http://localhost:5173" onChange={(e) => setForm({ ...form, localUrl: e.target.value })} />
              </label>
              <label>
                Comando dev
                <input value={form.devCommand} placeholder="npm run dev" onChange={(e) => setForm({ ...form, devCommand: e.target.value })} />
              </label>
              <label>
                Comando build
                <input value={form.buildCommand} placeholder="npm run build" onChange={(e) => setForm({ ...form, buildCommand: e.target.value })} />
              </label>
              <label className="edit-check">
                <input type="checkbox" checked={form.zipEnabled} onChange={(e) => setForm({ ...form, zipEnabled: e.target.checked })} />
                Habilitar "Crear ZIP" (plugins)
              </label>
            </div>
            <div className="modal-actions">
              <button type="button" className="cmd-btn cmd-ghost" onClick={() => setShowEdit(false)}>
                Cancelar
              </button>
              <button type="button" className="cmd-btn cmd-primary" onClick={saveEdit} disabled={saving}>
                {saving ? 'Guardando…' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
