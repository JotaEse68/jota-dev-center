# Jota Dev Center

> Un panel de escritorio local para gestionar todos tus proyectos de desarrollo desde un solo sitio, pensado para el flujo **PowerShell · Claude Code · GitHub · Vercel**.

![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![Platform](https://img.shields.io/badge/platform-Windows-0078D6)
![Stack](https://img.shields.io/badge/stack-Electron%20%2B%20React%20%2B%20Express-61dafb)

Escanea tu carpeta de proyectos y los muestra como tarjetas con estado Git, favoritos y grupos. Desde cada proyecto abres **Claude Code, Codex, PowerShell, VS Code, Cursor o el Explorador** con un clic, ejecutas dev/build, gestionas Git con seguridad, clonas repos de GitHub y abres tus despliegues (Vercel, Netlify, Supabase, Render). Incluye un **léxico técnico** integrado para aprender vocabulario.

Es una **app de escritorio (Electron)** con un backend Express embebido. También puede ejecutarse como app web local en `http://localhost:3333`.

> **Plataforma:** Windows (instalador `.exe` en Releases), y **macOS / Linux** vía build desde código o GitHub Actions (`.dmg` / `.AppImage`). En Windows usa PowerShell 7; en macOS abre Terminal.app; en Linux usa gnome-terminal. Soporte **WSL/Ubuntu** incluido.

## ✨ Características

- 📂 **Escaneo automático** de tu carpeta de proyectos al abrir (añade nuevas, quita borradas).
- 🤖 **IA configurable** por proyecto: Claude Code, Codex, **Cursor, Gemini, Aider, Cline…** (cualquier CLI) con un clic.
- 🧩 Terminal, **VS Code / Cursor / Explorer**, `dev` y `build`.
- 🔀 **Git seguro**: status, pull, commit (con mensaje) y push (con confirmación).
- ⬇ **Clonar de GitHub** desde la app (con tu lista de repos vía GitHub CLI o pegando la URL).
- 🔗 **✎ Editar por proyecto**: pega URLs de GitHub / Vercel / Netlify / Supabase / Render y aparecen sus botones.
- 🗜 **Crear ZIP** de plugins/WordPress (excluye `node_modules`, `.git`, etc.).
- 🐧 **Windows y WSL** diferenciados visualmente.
- 📚 **Aprender**: léxico técnico integrado (123 tarjetas).
- 🔒 **Seguro**: sin comandos libres, sin tokens, sin commits/push automáticos.

---

## Qué es

Un dashboard que centraliza tus proyectos y te permite, desde un solo sitio:

- Ver todos tus proyectos (Windows y WSL) con su tipo, entorno, favoritos, estado Git e integraciones activas.
- Abrir **Claude Code** (acción principal destacada) y **Codex** (secundaria) en la carpeta del proyecto.
- Abrir PowerShell, VS Code, Cursor o el Explorador en la carpeta.
- Ejecutar `npm run dev` / `npm run build`.
- Ver `git status`, hacer `git pull`, `git commit` (con mensaje) y `git push` (con confirmación).
- Abrir GitHub, Vercel y la URL local.
- Crear ZIPs de plugins/WordPress excluyendo carpetas pesadas.
- Guardar notas internas por proyecto.
- Ejecutar comandos personalizados definidos previamente (sin campo libre por seguridad).

---

## Requisitos

- **Node.js 18+** (recomendado 20+).
- **PowerShell 7** (`pwsh`) como terminal principal en Windows.
- Opcional: `git`, `code` (VS Code), `cursor`, `claude`, `codex` en el `PATH`.
- Opcional: WSL/Ubuntu para proyectos con `environment: "wsl"`.

---

## Instalación

```powershell
git clone https://github.com/JotaEse68/jota-dev-center.git
cd jota-dev-center
npm install
```

> ¿Solo quieres usarla? Descarga el instalador `.exe` desde la sección [**Releases**](https://github.com/JotaEse68/jota-dev-center/releases).

## Ejecutar (desarrollo)

```powershell
npm run dev
```

Se abre en:

```text
http://localhost:3333
```

Internamente:

- El **frontend** (Vite) sirve en `http://localhost:3333`.
- El **backend** (Express) corre en `http://127.0.0.1:3334` y Vite hace proxy de `/api` hacia él.

## Ejecutar (versión construida)

```powershell
npm run build
npm run start
```

En este modo Express sirve el frontend ya compilado **y** la API en el mismo puerto `3333`.

---

## Acceso directo en el escritorio

Crea el acceso directo **Jota Dev Center** en tu escritorio:

```powershell
npm run shortcut
```

Esto ejecuta `scripts/create-desktop-shortcut.ps1`, que:

- Crea `Jota Dev Center.lnk` en el escritorio.
- Apunta a `scripts/start-jota-dev-center.bat`.
- Al hacer doble clic: instala dependencias si faltan, arranca la app y **abre el navegador** en `http://localhost:3333`.

Para detener la app, cierra la ventana de PowerShell que queda abierta.

> Si Windows bloquea la ejecución de scripts, los lanzadores ya usan `-ExecutionPolicy Bypass`, así que no necesitas cambiar tu política global.

---

## App de escritorio (.exe Electron)

Además de la versión web, Jota Dev Center se puede empaquetar como una aplicación de escritorio nativa con su propia ventana (sin navegador ni terminal). El servidor Express va embebido y arranca solo al abrir la app.

### Generar el instalador

```powershell
npm run dist:win
```

Genera en `release/`:

- `Jota Dev Center Setup 1.0.0.exe` — instalador. Al instalarlo crea el acceso directo en escritorio y menú Inicio.
- `win-unpacked/Jota Dev Center.exe` — la app suelta, ejecutable sin instalar.

> **Requisito en Windows:** `electron-builder` descarga herramientas que contienen symlinks de macOS. Windows necesita el **Modo de desarrollador** activado (Configuración → Privacidad y seguridad → Para programadores → "Modo de desarrollador") **o** ejecutar la terminal como Administrador. Sin eso, el empaquetado falla con "El cliente no dispone de un privilegio requerido".
>
> Como el `.exe` no está firmado, Windows SmartScreen puede avisar de "editor desconocido": **Más información → Ejecutar de todas formas**.

### Probar la app sin empaquetar

```powershell
npm run app
```

Compila el frontend, bundlea el proceso principal y abre la ventana de Electron directamente.

### Alternativa portable (sin electron-builder)

Si no puedes/quieres activar el Modo de desarrollador, hay un empaquetado manual que evita `electron-builder`:

```powershell
npm run electron:build
powershell -ExecutionPolicy Bypass -File scripts/package-portable.ps1
```

Crea `release/JotaDevCenter/Jota Dev Center.exe` y un acceso directo en el escritorio.

### Datos en modo escritorio

En la app instalada, `projects.json` / `notes.json` / `settings.json` se copian la primera vez a una carpeta escribible del usuario (`%APPDATA%/jota-dev-center/data`) para que tus cambios persistan entre actualizaciones. En modo web siguen leyéndose de `data/`.

---

## Cómo añadir proyectos

Edita `data/projects.json` y añade un objeto. Estructura:

```json
{
  "id": "mi-proyecto",
  "name": "Mi Proyecto",
  "type": "react",
  "environment": "windows",
  "path": "C:\\Users\\Jota\\Projects\\mi-proyecto",
  "favorite": false,
  "repoUrl": "https://github.com/JotaEse68/mi-proyecto",
  "deployUrl": "",
  "localUrl": "http://localhost:5173",
  "devCommand": "npm run dev",
  "buildCommand": "npm run build",
  "aiCommand": "claude",
  "secondaryAiCommand": "codex",
  "editor": "vscode",
  "usesVercel": true,
  "usesSupabase": false,
  "usesRender": false,
  "usesNetlify": false,
  "zipEnabled": false,
  "customCommands": [
    { "label": "Git status", "command": "git status" }
  ]
}
```

**Tipos** (`type`): `wordpress`, `plugin`, `react`, `vite`, `next`, `app`, `api`, `other`.
**Entornos** (`environment`): `windows`, `wsl`.

> Las rutas Windows en JSON deben llevar las barras invertidas escapadas: `C:\\Users\\TU-USUARIO\\...`.

### Proyectos Windows

```json
"environment": "windows",
"path": "C:\\Users\\TU-USUARIO\\Projects\\ejemplo-app"
```

Los comandos se ejecutan abriendo una ventana de PowerShell:

```powershell
Start-Process pwsh -ArgumentList "-NoExit","-Command","cd 'RUTA'; COMANDO"
```

### Proyectos WSL

```json
"environment": "wsl",
"path": "/home/jota/proyectos/editor-pro-max"
```

Los comandos se ejecutan dentro de WSL:

```powershell
Start-Process pwsh -ArgumentList "-NoExit","-Command","wsl -e bash -lc 'cd /home/jota/proyectos/editor-pro-max && claude'"
```

La interfaz distingue visualmente Windows (azul 🪟) y WSL (naranja 🐧).

---

## Uso

### Abrir Claude

Botón **Claude Code** (destacado) en el detalle del proyecto. Ejecuta el comando `aiCommand` (por defecto `claude`) en la carpeta. Si `claude` no está en el `PATH`, muestra un error claro.

### Abrir Codex

Botón secundario **Codex**. Ejecuta `secondaryAiCommand` (por defecto `codex`).

### GitHub / Vercel

- **GitHub**: aparece si el proyecto tiene `repoUrl`.
- **Vercel**: aparece si `usesVercel` es `true` (abre `deployUrl` o el dashboard de Vercel).
- También se muestran botones de **Supabase / Render / Netlify** si defines sus URLs.

### Git seguro

- **git commit**: abre un modal, pide el mensaje y ejecuta `git add .` + `git commit -m "mensaje"`.
- **git push**: pide confirmación antes de ejecutar `git push`.
- Nunca se hacen commits ni push automáticos.

### Crear ZIPs de plugins

Para proyectos con `"zipEnabled": true` aparece el botón **Crear ZIP**. Genera en la carpeta `exports/` del proyecto un archivo:

```text
id-proyecto-YYYY-MM-DD-HHMM.zip
```

Excluyendo siempre: `node_modules`, `.git`, `dist`, `build`, `.next`, `.vercel`, `.netlify`, `vendor`, `exports`, `.DS_Store`. El botón **Abrir carpeta exports** te lleva a la carpeta. (La creación de ZIP está soportada en proyectos Windows.)

### Editar notas

Cada proyecto tiene un panel de **Notas internas** (estado, pendientes, prompts útiles, enlaces, decisiones). Se guardan en `data/notes.json` con el botón **Guardar**.

### Comandos personalizados

Defínelos en `customCommands` dentro de `projects.json`:

```json
"customCommands": [
  { "label": "Limpiar Node", "command": "Remove-Item node_modules -Recurse -Force; npm install" },
  { "label": "Build seguro", "command": "npm run build" }
]
```

Aparecen como botones en el detalle del proyecto. **Por seguridad no existe un campo libre** para escribir comandos desde la UI: solo se ejecutan los definidos en el JSON. Antes de ejecutar comandos potencialmente sensibles (que contengan borrados, `reset --hard`, etc.) se pide confirmación.

---

## Ajustes

`data/settings.json` define las raíces de proyectos, editor e IAs por defecto y el puerto. La pantalla **Ajustes** muestra estos valores (edición avanzada en una versión futura; por ahora edita el JSON).

---

## Estructura

```text
jota-dev-center/
  package.json
  vite.config.ts
  index.html
  README.md
  data/
    projects.json
    notes.json
    settings.json
  server/
    index.ts
    services/
      projects.ts
      git.ts
      commands.ts
      zip.ts
      shortcuts.ts
      environment.ts
  src/
    main.tsx
    App.tsx
    api.ts
    types.ts
    meta.ts
    components/
      Sidebar.tsx
      ProjectCard.tsx
      ProjectDetail.tsx
      StatusBadge.tsx
      CommandButton.tsx
      NotesPanel.tsx
      SettingsPanel.tsx
    styles/
      app.css
  scripts/
    start-jota-dev-center.ps1
    start-jota-dev-center.bat
    create-desktop-shortcut.ps1
```

---

## Seguridad

- No se borra nada fuera de la carpeta del proyecto.
- No se ejecutan comandos destructivos automáticamente.
- Se valida que la ruta exista (en Windows) antes de actuar.
- No se guardan secretos ni se piden tokens.
- No se hace commit/push sin confirmación.
- No hay campo libre de comandos en la UI.

---

## Scripts npm

| Script | Acción |
| --- | --- |
| `npm run dev` | Backend (3334) + frontend (3333) en desarrollo |
| `npm run server:dev` | Solo backend Express con recarga |
| `npm run client:dev` | Solo frontend Vite |
| `npm run build` | Compila el frontend a `dist/` |
| `npm run start` | Sirve la versión construida en `http://localhost:3333` |
| `npm run shortcut` | Crea el acceso directo (versión web) del escritorio |
| `npm run app` | Abre la app de escritorio Electron (sin empaquetar) |
| `npm run dist:win` | Genera el instalador `.exe` en `release/` |
