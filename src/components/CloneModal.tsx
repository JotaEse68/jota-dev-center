import { useEffect, useState } from 'react';
import { api } from '../api';

interface Props {
  onClose: () => void;
  onCloned: () => void;
}

export default function CloneModal({ onClose, onCloned }: Props) {
  const [repo, setRepo] = useState('');
  const [repos, setRepos] = useState<{ name: string; visibility: string; url: string }[]>([]);
  const [cloning, setCloning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.listRepos().then(setRepos).catch(() => setRepos([]));
  }, []);

  async function doClone(value: string) {
    const target = value.trim();
    if (!target) return;
    setCloning(true);
    setError(null);
    try {
      const res = await api.cloneRepo(target);
      onCloned();
      onClose();
      void res;
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setCloning(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-wide" onClick={(e) => e.stopPropagation()}>
        <h3>Clonar de GitHub</h3>
        <p className="muted">
          Pega la URL o <code>usuario/repo</code>. Se clonará en <code>GitHub Repos</code> dentro de tu carpeta de
          proyectos y aparecerá en el panel.
        </p>

        <div className="clone-input-row">
          <input
            className="clone-input"
            autoFocus
            value={repo}
            placeholder="https://github.com/usuario/repo  ó  usuario/repo"
            onChange={(e) => setRepo(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') doClone(repo);
            }}
          />
          <button type="button" className="cmd-btn cmd-primary" onClick={() => doClone(repo)} disabled={cloning || !repo.trim()}>
            {cloning ? 'Clonando…' : 'Clonar'}
          </button>
        </div>

        {error ? <div className="alert alert-error">{error}</div> : null}

        {repos.length > 0 ? (
          <>
            <h4 className="clone-list-title">Tus repos ({repos.length})</h4>
            <div className="clone-list">
              {repos.map((r) => (
                <button key={r.name} type="button" className="clone-item" disabled={cloning} onClick={() => doClone(r.name)}>
                  <span className="clone-name">{r.name}</span>
                  <span className={`clone-vis vis-${r.visibility.toLowerCase()}`}>{r.visibility.toLowerCase()}</span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <p className="muted clone-nogh">
            (Para ver tu lista de repos necesitas GitHub CLI autenticado: <code>gh auth login</code>. Sin él, pega la URL
            completa arriba.)
          </p>
        )}

        <div className="modal-actions">
          <button type="button" className="cmd-btn cmd-ghost" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
