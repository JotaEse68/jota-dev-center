import { app, BrowserWindow, shell, Menu, dialog } from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import { startServer } from '../server/index';

// Marca para que server/index.ts NO se auto-arranque al importarlo.
process.env.JOTA_EMBEDDED = '1';
process.env.NODE_ENV = 'production';

let mainWindow: BrowserWindow | null = null;

/** Registro de arranque en userData para diagnosticar problemas. */
function log(msg: string): void {
  try {
    fs.appendFileSync(path.join(app.getPath('userData'), 'startup.log'), `[${new Date().toISOString()}] ${msg}\n`);
  } catch {
    /* ignore */
  }
}

/**
 * Copia los datos por defecto (projects/notes/settings) a una carpeta escribible
 * dentro de userData la primera vez. Así las ediciones del usuario persisten y no
 * se sobrescriben al actualizar la app.
 */
function ensureDataDir(): string {
  const dataDir = path.join(app.getPath('userData'), 'data');
  const seedDir = path.join(app.getAppPath(), 'data');

  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  for (const file of ['projects.json', 'notes.json', 'settings.json']) {
    const dest = path.join(dataDir, file);
    const src = path.join(seedDir, file);
    if (!fs.existsSync(dest) && fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
    }
  }
  return dataDir;
}

async function createWindow(): Promise<void> {
  try {
    log('Iniciando Jota Dev Center...');
    const dataDir = ensureDataDir();
    process.env.JOTA_DATA_DIR = dataDir;
    log(`Data dir: ${dataDir}`);

    const staticDir = path.join(app.getAppPath(), 'dist');
    log(`Static dir: ${staticDir} (existe=${fs.existsSync(staticDir)})`);

    const { port } = await startServer({ port: 0, serveStatic: true, staticDir });
    log(`Servidor embebido escuchando en puerto ${port}`);

    const iconPath = path.join(app.getAppPath(), 'icon.ico');

    mainWindow = new BrowserWindow({
      width: 1360,
      height: 880,
      minWidth: 1024,
      minHeight: 680,
      backgroundColor: '#0c0f17',
      title: 'Jota Dev Center',
      icon: fs.existsSync(iconPath) ? iconPath : undefined,
      autoHideMenuBar: true,
      show: false,
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
      },
    });

    Menu.setApplicationMenu(null);

    // Los enlaces externos (GitHub, Vercel, URL local...) se abren en el navegador del sistema.
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
      if (url.startsWith(`http://127.0.0.1:${port}`) || url.startsWith(`http://localhost:${port}`)) {
        return { action: 'allow' };
      }
      shell.openExternal(url);
      return { action: 'deny' };
    });

    mainWindow.webContents.on('did-fail-load', (_e, code, desc, url) => {
      log(`did-fail-load code=${code} desc=${desc} url=${url}`);
    });

    mainWindow.once('ready-to-show', () => {
      mainWindow?.show();
      log('Ventana mostrada.');
    });

    await mainWindow.loadURL(`http://127.0.0.1:${port}`);
    log('URL cargada correctamente.');

    mainWindow.on('closed', () => {
      mainWindow = null;
    });
  } catch (err) {
    const msg = (err as Error).stack || String(err);
    log(`ERROR: ${msg}`);
    dialog.showErrorBox('Jota Dev Center — error al iniciar', msg);
    app.quit();
  }
}

app.whenReady().then(createWindow);

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

app.on('window-all-closed', () => {
  app.quit();
});
