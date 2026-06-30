import { useEffect, useState } from 'react';
import { api } from '../api';

interface Props {
  projectId: string;
  onResult?: (ok: boolean, message: string) => void;
}

export default function NotesPanel({ projectId, onResult }: Props) {
  const [content, setContent] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    let active = true;
    setLoaded(false);
    api
      .getNote(projectId)
      .then((res) => {
        if (!active) return;
        setContent(res.content);
        setDirty(false);
        setLoaded(true);
      })
      .catch(() => {
        if (active) setLoaded(true);
      });
    return () => {
      active = false;
    };
  }, [projectId]);

  async function save() {
    setSaving(true);
    try {
      await api.saveNote(projectId, content);
      setDirty(false);
      onResult?.(true, 'Notas guardadas.');
    } catch (err) {
      onResult?.(false, (err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="notes-panel">
      <div className="notes-header">
        <h4>Notas internas</h4>
        <button type="button" className="cmd-btn cmd-primary" onClick={save} disabled={saving || !dirty}>
          {saving ? 'Guardando…' : dirty ? 'Guardar' : 'Guardado'}
        </button>
      </div>
      <textarea
        className="notes-textarea"
        value={content}
        placeholder={loaded ? 'Estado actual, pendientes, prompts útiles, enlaces, decisiones técnicas…' : 'Cargando…'}
        onChange={(e) => {
          setContent(e.target.value);
          setDirty(true);
        }}
        disabled={!loaded}
      />
    </div>
  );
}
