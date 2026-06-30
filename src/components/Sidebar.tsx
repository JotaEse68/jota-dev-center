import { SIDEBAR_FILTERS } from '../meta';
import type { Project } from '../types';

export type View = 'projects' | 'settings' | 'help' | 'learn';

interface Props {
  projects: Project[];
  activeFilter: string;
  view: View;
  onFilter: (key: string) => void;
  onView: (view: View) => void;
}

export default function Sidebar({ projects, activeFilter, view, onFilter, onView }: Props) {
  function count(filterKey: string): number {
    const filter = SIDEBAR_FILTERS.find((f) => f.key === filterKey);
    if (!filter) return 0;
    return projects.filter(filter.match).length;
  }

  const groups = (() => {
    const map = new Map<string, number>();
    for (const p of projects) {
      if (p.group) map.set(p.group, (map.get(p.group) ?? 0) + 1);
    }
    return [...map.entries()]
      .map(([name, c]) => ({ name, count: c }))
      .sort((a, b) => a.name.localeCompare(b.name));
  })();

  const onProjects = view === 'projects';

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-logo">JD</div>
        <div className="brand-text">
          <strong>Jota Dev Center</strong>
          <span>Panel local</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {SIDEBAR_FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            className={`nav-item ${onProjects && activeFilter === f.key ? 'active' : ''}`}
            onClick={() => onFilter(f.key)}
          >
            <span>{f.label}</span>
            <span className="nav-count">{count(f.key)}</span>
          </button>
        ))}

        {groups.length > 0 ? (
          <div className="nav-section">
            <span className="nav-section-title">Grupos</span>
            {groups.map((g) => (
              <button
                key={g.name}
                type="button"
                className={`nav-item ${onProjects && activeFilter === `group:${g.name}` ? 'active' : ''}`}
                onClick={() => onFilter(`group:${g.name}`)}
                title={g.name}
              >
                <span className="nav-group-label">{g.name}</span>
                <span className="nav-count">{g.count}</span>
              </button>
            ))}
          </div>
        ) : null}
      </nav>

      <div className="sidebar-footer">
        <button type="button" className={`nav-item ${view === 'learn' ? 'active' : ''}`} onClick={() => onView('learn')}>
          <span>📚 Aprender</span>
        </button>
        <button type="button" className={`nav-item ${view === 'help' ? 'active' : ''}`} onClick={() => onView('help')}>
          <span>❔ Ayuda</span>
        </button>
        <button type="button" className={`nav-item ${view === 'settings' ? 'active' : ''}`} onClick={() => onView('settings')}>
          <span>⚙️ Ajustes</span>
        </button>
      </div>
    </aside>
  );
}
