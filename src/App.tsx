import { useEffect, useMemo, useState } from 'react';
import { api } from './api';
import type { Project, GitStatus } from './types';
import { SIDEBAR_FILTERS, TYPE_META } from './meta';
import Sidebar, { type View } from './components/Sidebar';
import ProjectCard from './components/ProjectCard';
import ProjectDetail from './components/ProjectDetail';
import SettingsPanel from './components/SettingsPanel';
import HelpPanel from './components/HelpPanel';
import CloneModal from './components/CloneModal';

export default function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [gitMap, setGitMap] = useState<Record<string, GitStatus | null>>({});
  const [gitLoading, setGitLoading] = useState<Record<string, boolean>>({});
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [view, setView] = useState<View>('projects');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanMsg, setScanMsg] = useState<string | null>(null);
  const [showClone, setShowClone] = useState(false);

  async function loadProjects() {
    try {
      const data = await api.getProjects();
      setProjects(data);
      setLoadError(null);
      if (!selectedId && data.length > 0) {
        const firstFav = data.find((p) => p.favorite) ?? data[0];
        setSelectedId(firstFav.id);
      }
      data.forEach((p) => refreshGit(p.id));
    } catch (err) {
      setLoadError((err as Error).message);
    }
  }

  async function refreshGit(id: string) {
    setGitLoading((m) => ({ ...m, [id]: true }));
    try {
      const status = await api.getGit(id);
      setGitMap((m) => ({ ...m, [id]: status }));
    } catch {
      setGitMap((m) => ({ ...m, [id]: { state: 'error', branch: null, changes: 0 } }));
    } finally {
      setGitLoading((m) => ({ ...m, [id]: false }));
    }
  }

  useEffect(() => {
    // Auto-escaneo al abrir: detecta carpetas nuevas en la raíz y luego carga.
    api
      .scan()
      .catch(() => undefined)
      .finally(() => loadProjects());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleScan() {
    setScanning(true);
    setScanMsg(null);
    try {
      const res = await api.scan();
      await loadProjects();
      setScanMsg(`Escaneo de ${res.root}: ${res.found} encontrados, ${res.added} nuevos, ${res.total} en total.`);
    } catch (err) {
      setScanMsg(`Error al escanear: ${(err as Error).message}`);
    } finally {
      setScanning(false);
    }
  }

  async function handleToggleFavorite(id: string) {
    try {
      const res = await api.toggleFavorite(id);
      setProjects((ps) => ps.map((p) => (p.id === id ? { ...p, favorite: res.favorite } : p)));
    } catch {
      /* ignore */
    }
  }

  const activeFilter = SIDEBAR_FILTERS.find((f) => f.key === filter) ?? SIDEBAR_FILTERS[0];

  const matchFilter = (p: Project): boolean => {
    if (filter.startsWith('group:')) return p.group === filter.slice('group:'.length);
    return activeFilter.match(p);
  };

  const visibleProjects = useMemo(() => {
    const term = search.trim().toLowerCase();
    return projects
      .filter(matchFilter)
      .filter(
        (p) =>
          !term ||
          p.name.toLowerCase().includes(term) ||
          p.id.toLowerCase().includes(term) ||
          p.path.toLowerCase().includes(term),
      )
      .sort((a, b) => Number(b.favorite) - Number(a.favorite) || a.name.localeCompare(b.name));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projects, filter, activeFilter, search]);

  const selected = projects.find((p) => p.id === selectedId) ?? null;

  return (
    <div className="app">
      <Sidebar
        projects={projects}
        activeFilter={filter}
        view={view}
        onFilter={(key) => {
          setFilter(key);
          setView('projects');
        }}
        onView={setView}
      />

      <main className="main">
        <header className="topbar">
          <div className="topbar-title">
            <h1>Jota Dev Center</h1>
            <span className="topbar-flow">PowerShell · Claude Code · GitHub · Vercel</span>
          </div>
          <div className="topbar-actions">
            <input
              className="search"
              type="search"
              placeholder="Buscar proyecto…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button
              type="button"
              className="cmd-btn cmd-ghost"
              onClick={() => setShowClone(true)}
              title="Clonar un repositorio de GitHub a tu carpeta de proyectos"
            >
              ⬇ Clonar de GitHub
            </button>
            <button
              type="button"
              className="cmd-btn cmd-secondary"
              onClick={handleScan}
              disabled={scanning}
              title="Escanear la carpeta raíz y añadir los proyectos encontrados"
            >
              {scanning ? 'Escaneando…' : '↻ Escanear proyectos'}
            </button>
          </div>
        </header>

        {scanMsg ? (
          <div className="alert alert-ok" style={{ margin: '1rem 1.5rem' }}>
            {scanMsg}
            <button type="button" className="alert-close" onClick={() => setScanMsg(null)}>
              ×
            </button>
          </div>
        ) : null}

        {loadError ? (
          <div className="alert alert-error" style={{ margin: '1rem 1.5rem' }}>
            No se pudo cargar la lista de proyectos: {loadError}. ¿Está el servidor en marcha?
          </div>
        ) : null}

        {view === 'settings' ? (
          <div className="content single">
            <SettingsPanel onScanned={loadProjects} />
          </div>
        ) : view === 'help' ? (
          <div className="content single">
            <HelpPanel />
          </div>
        ) : view === 'learn' ? (
          <div className="content learn">
            <iframe title="Aprender — Léxico" src="/lexicon.html" className="learn-frame" />
          </div>
        ) : (
          <div className="content split">
            <section className="project-list">
              <div className="type-filters">
                {Object.entries(TYPE_META).map(([key, meta]) => (
                  <button
                    key={key}
                    type="button"
                    className={`type-filter ${filter === key ? 'active' : ''}`}
                    onClick={() => setFilter(filter === key ? 'all' : key)}
                    title={meta.label}
                  >
                    {meta.icon} {meta.label}
                  </button>
                ))}
              </div>

              {visibleProjects.length === 0 ? (
                <div className="muted empty">
                  <p>No hay proyectos para este filtro.</p>
                  <p>
                    Si es tu primera vez: ve a <strong>⚙️ Ajustes</strong>, pon tu carpeta de proyectos y pulsa{' '}
                    <strong>Guardar y escanear</strong>.
                  </p>
                </div>
              ) : (
                visibleProjects.map((p) => (
                  <ProjectCard
                    key={p.id}
                    project={p}
                    git={gitMap[p.id]}
                    gitLoading={gitLoading[p.id]}
                    selected={p.id === selectedId}
                    onSelect={() => setSelectedId(p.id)}
                    onToggleFavorite={() => handleToggleFavorite(p.id)}
                  />
                ))
              )}
            </section>

            <section className="project-detail">
              {selected ? (
                <ProjectDetail
                  project={selected}
                  git={gitMap[selected.id]}
                  gitLoading={gitLoading[selected.id]}
                  onToggleFavorite={() => handleToggleFavorite(selected.id)}
                  onRefreshGit={() => refreshGit(selected.id)}
                  onUpdated={loadProjects}
                />
              ) : (
                <p className="muted empty">Selecciona un proyecto para ver sus acciones.</p>
              )}
            </section>
          </div>
        )}
      </main>

      {showClone ? (
        <CloneModal
          onClose={() => setShowClone(false)}
          onCloned={() => {
            setScanMsg('Repo clonado y añadido.');
            loadProjects();
          }}
        />
      ) : null}
    </div>
  );
}
