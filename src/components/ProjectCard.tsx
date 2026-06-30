import type { Project, GitStatus } from '../types';
import { TYPE_META, ENV_META } from '../meta';
import StatusBadge from './StatusBadge';

interface Props {
  project: Project;
  git?: GitStatus | null;
  gitLoading?: boolean;
  selected: boolean;
  onSelect: () => void;
  onToggleFavorite: () => void;
}

function Integrations({ project }: { project: Project }) {
  const items: { label: string; on: boolean }[] = [
    { label: 'GitHub', on: !!project.repoUrl },
    { label: 'Vercel', on: !!project.usesVercel },
    { label: 'Supabase', on: !!project.usesSupabase },
    { label: 'Render', on: !!project.usesRender },
    { label: 'Netlify', on: !!project.usesNetlify },
  ];
  const active = items.filter((i) => i.on);
  if (active.length === 0) return null;
  return (
    <div className="card-integrations">
      {active.map((i) => (
        <span key={i.label} className={`chip chip-${i.label.toLowerCase()}`}>
          {i.label}
        </span>
      ))}
    </div>
  );
}

export default function ProjectCard({
  project,
  git,
  gitLoading,
  selected,
  onSelect,
  onToggleFavorite,
}: Props) {
  const type = TYPE_META[project.type];
  const env = ENV_META[project.environment];

  return (
    <article
      className={`project-card ${selected ? 'selected' : ''} env-${project.environment}`}
      onClick={onSelect}
    >
      <div className="card-top">
        <div className="card-title">
          <span className="type-icon" title={type.label}>
            {type.icon}
          </span>
          <div>
            <h3>{project.name}</h3>
            <span className="card-type">
              {type.label}
              {project.group ? <span className="card-group"> · {project.group}</span> : null}
            </span>
          </div>
        </div>
        <button
          type="button"
          className={`fav-btn ${project.favorite ? 'on' : ''}`}
          title={project.favorite ? 'Quitar de favoritos' : 'Marcar favorito'}
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite();
          }}
        >
          {project.favorite ? '★' : '☆'}
        </button>
      </div>

      <div className="card-badges">
        <span className={`badge badge-env env-${project.environment}`}>
          {env.icon} {env.label}
        </span>
        <StatusBadge status={git} loading={gitLoading} />
      </div>

      <Integrations project={project} />

      <div className="card-path" title={project.path}>
        {project.path}
      </div>
    </article>
  );
}
