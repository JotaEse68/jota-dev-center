export default function HelpPanel() {
  return (
    <div className="help-panel">
      <h2>Ayuda — Cómo usar Jota Dev Center</h2>
      <p className="muted">Tu panel local para gestionar proyectos con el flujo PowerShell · Claude Code · GitHub · Vercel.</p>

      <section className="help-section">
        <h3>1. Tus proyectos aparecen solos</h3>
        <p>
          La app escanea tu <strong>carpeta de proyectos</strong> al abrirse: cada subcarpeta es un proyecto. Si creas
          una carpeta nueva, aparece sola la próxima vez que abras la app (o pulsa <strong>↻ Escanear proyectos</strong>).
          Si borras una carpeta, desaparece sola.
        </p>
        <p>
          Cambia la carpeta raíz en <strong>Ajustes</strong> → <em>Carpeta de proyectos (principal)</em> → <em>Guardar y
          escanear</em>.
        </p>
      </section>

      <section className="help-section">
        <h3>2. Trabajar en un proyecto</h3>
        <p>Pulsa un proyecto a la izquierda y a la derecha tienes botones que abren una terminal en su carpeta:</p>
        <ul>
          <li><strong>Claude Code</strong> (botón principal) y <strong>Codex</strong> — abren la IA en la carpeta.</li>
          <li><strong>PowerShell / VS Code / Cursor / Explorer</strong> — terminal, editores o carpeta.</li>
          <li><strong>dev / build</strong> — arranca o compila el proyecto.</li>
        </ul>
      </section>

      <section className="help-section">
        <h3>3. Git seguro</h3>
        <p>
          <strong>git status</strong> y <strong>git pull</strong> directos. <strong>git commit</strong> te pide el
          mensaje; <strong>git push</strong> pide confirmación. Nunca hace commits ni push automáticos.
        </p>
      </section>

      <section className="help-section">
        <h3>4. Enlaces (GitHub / Vercel / Netlify)</h3>
        <p>
          En cada proyecto pulsa <strong>✎ editar</strong> y pega las URLs de GitHub, Vercel, Netlify, Supabase o Render.
          Al guardar, aparecen sus botones que abren la web. El repo de GitHub se detecta solo si la carpeta ya es un
          repositorio git.
        </p>
      </section>

      <section className="help-section">
        <h3>5. Clonar de GitHub</h3>
        <p>
          Pulsa <strong>⬇ Clonar de GitHub</strong> (arriba), pega la URL o <code>usuario/repo</code> (o elige de la
          lista si tienes GitHub CLI), y se clona en <code>GitHub Repos</code> dentro de tu carpeta. Luego aparece como
          un proyecto más.
        </p>
      </section>

      <section className="help-section">
        <h3>6. Plugins → Crear ZIP</h3>
        <p>
          En proyectos de tipo plugin/WordPress, el botón <strong>Crear ZIP</strong> genera el paquete listo para subir
          (sin <code>node_modules</code>, <code>.git</code>, etc.) en una carpeta <code>exports</code>.
        </p>
      </section>

      <section className="help-section">
        <h3>7. Notas y Aprender</h3>
        <p>
          Cada proyecto tiene un bloque de <strong>Notas</strong>. Y en <strong>Aprender</strong> tienes el léxico
          técnico (PowerShell, Git, React, Vercel…) para repasar vocabulario.
        </p>
      </section>
    </div>
  );
}
