import { useEffect, useState } from 'react';
import { api } from '../api';
import type { Settings } from '../types';

const FIELDS: { key: keyof Settings; label: string; hint?: string }[] = [
  { key: 'defaultProjectsRoot', label: 'Carpeta de proyectos (principal)', hint: 'La que escanea el botón "Escanear proyectos".' },
  { key: 'secondaryProjectsRoot', label: 'Carpeta de proyectos (secundaria)' },
  { key: 'wslProjectsRoot', label: 'Carpeta de proyectos WSL (Ubuntu)' },
  { key: 'defaultEditor', label: 'Editor por defecto' },
  { key: 'primaryAI', label: 'IA principal' },
  { key: 'secondaryAI', label: 'IA secundaria' },
  { key: 'defaultPort', label: 'Puerto' },
];

interface Props {
  onScanned?: () => void;
}

export default function SettingsPanel({ onScanned }: Props) {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    api
      .getSettings()
      .then(setSettings)
      .catch((err) => setError((err as Error).message));
  }, []);

  function update<K extends keyof Settings>(key: K, value: Settings[K]) {
    setSettings((s) => (s ? { ...s, [key]: value } : s));
    setDirty(true);
    setFeedback(null);
  }

  async function save() {
    if (!settings) return;
    setSaving(true);
    setError(null);
    try {
      const res = await api.saveSettings(settings);
      setSettings(res.settings);
      setDirty(false);
      setFeedback('Ajustes guardados.');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function saveAndScan() {
    if (!settings) return;
    setScanning(true);
    setError(null);
    try {
      await api.saveSettings(settings);
      setDirty(false);
      const res = await api.scan();
      setFeedback(`Escaneo de ${res.root}: ${res.found} encontrados, ${res.added} nuevos, ${res.total} en total.`);
      onScanned?.();
    } catch (err) {
      setError(`No se pudo escanear: ${(err as Error).message}`);
    } finally {
      setScanning(false);
    }
  }

  return (
    <div className="settings-panel">
      <h2>Ajustes</h2>
      <p className="muted">
        Edita aquí las rutas y opciones. Se guardan al pulsar <strong>Guardar</strong>. La carpeta principal es la que
        usa el botón de escaneo para encontrar tus proyectos.
      </p>

      {error ? <div className="alert alert-error">{error}</div> : null}
      {feedback ? <div className="alert alert-ok">{feedback}</div> : null}

      {settings ? (
        <>
          <div className="settings-grid">
            {FIELDS.map((f) => (
              <div key={String(f.key)} className="settings-row">
                <label>
                  {f.label}
                  {f.hint ? <span className="settings-hint">{f.hint}</span> : null}
                </label>
                <input
                  type={f.key === 'defaultPort' ? 'number' : 'text'}
                  value={String(settings[f.key] ?? '')}
                  onChange={(e) =>
                    update(
                      f.key,
                      (f.key === 'defaultPort' ? Number(e.target.value) : e.target.value) as Settings[typeof f.key],
                    )
                  }
                />
              </div>
            ))}
          </div>

          <div className="settings-actions">
            <button type="button" className="cmd-btn cmd-primary" onClick={save} disabled={saving || scanning || !dirty}>
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
            <button type="button" className="cmd-btn cmd-secondary" onClick={saveAndScan} disabled={saving || scanning}>
              {scanning ? 'Escaneando…' : '↻ Guardar y escanear proyectos'}
            </button>
          </div>
        </>
      ) : (
        !error && <p className="muted">Cargando…</p>
      )}
    </div>
  );
}
