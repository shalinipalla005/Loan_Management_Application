const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow = null;
let backendProcess = null; // retained for dev-only scenarios
let backendPort = null;

function resolveFrontendDist() {
  // Works in dev and in packaged (asar) mode
  return path.join(__dirname, '..', 'frontend', 'dist', 'index.html');
}

function resolveBackendEntry() {
  const appPath = app.isPackaged ? app.getAppPath() : path.join(__dirname, '..');
  return path.join(appPath, 'backend', 'server.js');
}

// Default to remote backend for packaged app; use local for development
const REMOTE_BACKEND_URL = process.env.REMOTE_BACKEND_URL || (app.isPackaged ? 'https://loan-management-application.onrender.com/api' : '');

async function startBackend() {
  // Hosted backend mode: do not start local server
  if (REMOTE_BACKEND_URL) {
    return;
  }
  const { default: getPort } = await import('get-port');
  backendPort = await getPort();
  const backendEntry = resolveBackendEntry();

  const userDataPath = app.getPath('userData');
  const dbPath = path.join(userDataPath, 'loan_management.db');
  const baseEnv = {
    ...process.env,
    PORT: String(backendPort),
    NODE_ENV: 'production',
    DATABASE_URL: `sqlite:${dbPath}`,
  };

  if (app.isPackaged) {
    // For packaged app, we'll use the remote backend instead of spawning a local one
    // This avoids the complex path resolution issues
    console.log('Packaged app detected - using remote backend');
    return Promise.resolve();
  }

  // Development: fork a separate Node child process
  return new Promise((resolve, reject) => {
    const env = { ...baseEnv };
    const cwd = path.join(__dirname, '..', 'backend');
    const { fork } = require('child_process');
    backendProcess = fork(backendEntry, [], { env, cwd, stdio: 'pipe' });

    let resolved = false;
    const onReady = () => {
      if (!resolved) {
        resolved = true;
        resolve();
      }
    };
    const readyRegex = /Server is running on port/i;
    backendProcess.stdout.on('data', (data) => {
      const text = data.toString();
      if (readyRegex.test(text)) onReady();
      console.log(`[backend] ${text.trim()}`);
    });
    backendProcess.stderr.on('data', (data) => {
      console.error(`[backend:error] ${data.toString().trim()}`);
    });
    backendProcess.on('exit', (code) => {
      console.log(`[backend] exited with code ${code}`);
      if (!resolved) reject(new Error(`Backend exited early with code ${code}`));
    });
    setTimeout(onReady, 8000);
  });
}

async function createWindow() {
  await startBackend();

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  const indexHtml = resolveFrontendDist();
  try {
    const query = REMOTE_BACKEND_URL
      ? { backendUrl: encodeURIComponent(REMOTE_BACKEND_URL) }
      : { backendPort: String(backendPort) };
    await mainWindow.loadFile(indexHtml, { query });
  } catch (e) {
    console.error('loadFile failed', e);
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Extra diagnostics for packaged builds
  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL, isMainFrame) => {
    console.error('Renderer failed to load:', { errorCode, errorDescription, validatedURL, isMainFrame });
  });
  mainWindow.webContents.on('console-message', (_event, level, message, line, sourceId) => {
    console.log(`[renderer:${level}] ${message} (${sourceId}:${line})`);
  });

  // Open devtools if an env flag is set (useful for packaged debugging)
  if (process.env.ELECTRON_OPEN_DEVTOOLS === '1') {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }
}

app.on('ready', async () => {
  try {
    await createWindow();
  } catch (err) {
    console.error('Failed to create window:', err);
    app.quit();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  if (backendProcess && !backendProcess.killed) {
    try { backendProcess.kill('SIGTERM'); } catch (_) {}
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// no-op


