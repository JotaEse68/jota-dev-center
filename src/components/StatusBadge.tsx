import type { GitStatus } from '../types';

const LABELS: Record<GitStatus['state'], string> = {
  clean: 'Limpio',
  dirty: 'Cambios',
  'no-git': 'No Git',
  error: 'Error',
};

interface Props {
  status?: GitStatus | null;
  loading?: boolean;
}

export default function StatusBadge({ status, loading }: Props) {
  if (loading) {
    return <span className="badge badge-git git-loading">Git…</span>;
  }
  if (!status) {
    return <span className="badge badge-git git-no-git">Git ?</span>;
  }

  const label = LABELS[status.state];
  const extra =
    status.state === 'dirty' && status.changes > 0 ? ` (${status.changes})` : '';

  return (
    <span className={`badge badge-git git-${status.state}`} title={status.message ?? ''}>
      <span className="git-dot" />
      {label}
      {extra}
      {status.branch ? <span className="git-branch">⎇ {status.branch}</span> : null}
    </span>
  );
}
