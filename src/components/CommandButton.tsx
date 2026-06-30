import { useState } from 'react';

interface Props {
  label: string;
  icon?: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'git';
  title?: string;
  disabled?: boolean;
  onRun: () => Promise<unknown>;
  onResult?: (ok: boolean, message: string) => void;
}

/**
 * Botón de acción que ejecuta una promesa (normalmente una llamada al backend),
 * muestra estado de carga y reporta el resultado al panel de feedback.
 */
export default function CommandButton({
  label,
  icon,
  variant = 'ghost',
  title,
  disabled,
  onRun,
  onResult,
}: Props) {
  const [busy, setBusy] = useState(false);

  async function handleClick() {
    if (busy || disabled) return;
    setBusy(true);
    try {
      const res = (await onRun()) as { ok?: boolean; message?: string } | undefined;
      const ok = res?.ok !== false;
      onResult?.(ok, res?.message ?? `${label}: hecho.`);
    } catch (err) {
      onResult?.(false, (err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      className={`cmd-btn cmd-${variant}`}
      onClick={handleClick}
      disabled={busy || disabled}
      title={title ?? label}
      type="button"
    >
      {icon ? <span className="cmd-icon">{icon}</span> : null}
      <span>{busy ? '…' : label}</span>
    </button>
  );
}
