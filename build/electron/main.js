const { app, BrowserWindow, ipcMain, dialog, Menu, shell } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const isDev = process.env.NODE_ENV === 'development';
const fs = require('fs');
const os = require('os');

// EARLY LOGGING
console.log('Electron main process starting...');

// ---- SINGLE INSTANCE LOCK ----
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
  process.exit(0);
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    // Someone tried to run a second instance, focus the main window.
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}
// ---- END SINGLE INSTANCE LOCK ----

// Global reference to window object
let mainWindow;
let backendProcess = null;

// Window state management
const windowStateKeeper = require('electron-window-state');

// Ensure user data directory and DB copy on first run (production only)
function ensureUserDatabase() {
  if (process.env.NODE_ENV !== 'production') return;
  const userDataPath = path.join(os.homedir(), '.loan-management');
  const userDbPath = path.join(userDataPath, 'loan_management.db');
  const bundledDbPath = path.join(__dirname, '../backend/models/loan_management.db');
  if (!fs.existsSync(userDataPath)) {
    fs.mkdirSync(userDataPath, { recursive: true });
  }
  if (!fs.existsSync(userDbPath)) {
    try {
      fs.copyFileSync(bundledDbPath, userDbPath);
      console.log('Copied bundled DB to user directory.');
    } catch (err) {
      console.error('Failed to copy DB:', err);
    }
  }
}

function createWindow() {
  console.log('🪟 Creating main window...');

  // Load the previous state with fallback to defaults
  const mainWindowState = windowStateKeeper({
    defaultWidth: 1200,
    defaultHeight: 800,
    file: 'window-state.json'
  });

  // Create the browser window
  mainWindow = new BrowserWindow({
    x: mainWindowState.x,
    y: mainWindowState.y,
    width: mainWindowState.width,
    height: mainWindowState.height,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: false // Allow loading local files
    },
    icon: path.join(__dirname, '../resources/icons/app-icon.png'),
    show: false, // Don't show until ready
    titleBarStyle: 'default',
    autoHideMenuBar: false
  });

  // Let us register listeners on the window, so we can update the state
  // automatically (the listeners will be removed when the window is closed)
  // and restore the maximized or full screen state
  mainWindowState.manage(mainWindow);

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    // Initialize services
    initializeServices();
    
    if (isDev) {
      mainWindow.webContents.openDevTools();
    }
  });

  // Load the app after services are initialized
  const startUrl = isDev 
    ? 'http://localhost:5173' 
    : `file://${path.join(__dirname, '../frontend/dist/index.html')}#/login`;

  // Load the frontend
  if (isDev) {
    // In development, wait for backend to be ready, then load frontend
    waitForBackend().then(() => {
      mainWindow.loadURL(startUrl);
    }).catch((error) => {
      console.error('Failed to connect to backend:', error);
      dialog.showErrorBox('Backend Error', 'Failed to connect to backend server. Please ensure the backend is running.');
    });
  } else {
    // In production, load frontend directly (backend is started in initializeServices)
    mainWindow.loadURL(startUrl);
  }

  // Force hash routing fallback
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!url.includes('#/')) {
      event.preventDefault();
      mainWindow.loadURL(startUrl);
    }
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Handle window close event
  mainWindow.on('close', async (event) => {
    if (!app.isQuiting) {
      event.preventDefault();
      
      const response = dialog.showMessageBoxSync(mainWindow, {
        type: 'question',
        title: 'Confirm Exit',
        message: 'Are you sure you want to exit?',
        buttons: ['Yes', 'No'],
        defaultId: 1
      });
      
      if (response === 0) {
        app.isQuiting = true;
        await cleanup();
        app.quit();
      }
    }
  });

  // Create application menu
  createMenu();
  ensureUserDatabase();
}

async function initializeServices() {
  try {
    console.log('🔧 Initializing services...');
    console.log('🔍 Development mode:', isDev);
    
    // In development, backend is started by concurrently, so we don't start it here
    // In production, we start the backend server
    if (!isDev) {
      console.log('🚀 Starting backend server (production mode)...');
      await startBackendServer();
    } else {
      console.log('⏭️  Skipping backend startup (development mode - backend started by concurrently)');
    }
    
    console.log('✅ Services initialized successfully');
    
  } catch (error) {
    console.error('❌ Service initialization failed:', error);
    dialog.showErrorBox('Initialization Error', 'Failed to initialize application services.');
  }
}

function waitForBackend() {
  return new Promise((resolve, reject) => {
    console.log('⏳ Waiting for backend server...');
    
    const maxAttempts = 60; // 30 seconds
    let attempts = 0;
    
    const checkBackend = () => {
      attempts++;
      
      // Simple HTTP request to check if backend is ready
      const http = require('http');
      const req = http.request({
        hostname: 'localhost',
        port: 3000,
        path: '/api/auth/health',
        method: 'GET',
        timeout: 1000
      }, (res) => {
        if (res.statusCode === 200 || res.statusCode === 404) {
          console.log('✅ Backend server is ready');
          resolve();
        } else {
          if (attempts < maxAttempts) {
            setTimeout(checkBackend, 500);
          } else {
            reject(new Error('Backend server not responding'));
          }
        }
      });
      
      req.on('error', () => {
        if (attempts < maxAttempts) {
          setTimeout(checkBackend, 500);
        } else {
          reject(new Error('Backend server not responding'));
        }
      });
      
      req.on('timeout', () => {
        req.destroy();
        if (attempts < maxAttempts) {
          setTimeout(checkBackend, 500);
        } else {
          reject(new Error('Backend server timeout'));
        }
      });
      
      req.end();
    };
    
    checkBackend();
  });
}

function getBackendPaths() {
  if (process.env.NODE_ENV === 'production') {
    // In packaged app, backend is under process.resourcesPath/app/backend
    const backendPath = path.join(process.resourcesPath, 'app', 'backend');
    const serverJsPath = path.join(backendPath, 'server.js');
    return { backendPath, serverJsPath };
  } else {
    // In dev, backend is relative to electron dir
    const backendPath = path.join(__dirname, '../backend');
    const serverJsPath = path.join(backendPath, 'server.js');
    return { backendPath, serverJsPath };
  }
}

function startBackendServer() {
  return new Promise((resolve, reject) => {
    try {
      const { backendPath, serverJsPath } = getBackendPaths();
      const nodePath = process.execPath;
      const userDataPath = path.join(os.homedir(), '.loan-management');
      if (!fs.existsSync(userDataPath)) fs.mkdirSync(userDataPath, { recursive: true });
      const logPath = path.join(userDataPath, 'backend.log');
      const out = fs.openSync(logPath, 'a');
      const err = fs.openSync(logPath, 'a');
      console.log('Attempting to start backend...');
      console.log('Resolved backendPath:', backendPath);
      console.log('Resolved serverJsPath:', serverJsPath);
      console.log('Current working directory:', process.cwd());
      if (!fs.existsSync(serverJsPath)) {
        const msg = `server.js not found at: ${serverJsPath}`;
        console.error(msg);
        dialog.showErrorBox('Backend Startup Error', msg);
        reject(new Error(msg));
        return;
      }
      // Use the absolute path to server.js as the argument
      backendProcess = spawn(nodePath, [serverJsPath], {
        cwd: backendPath,
        stdio: ['ignore', out, err],
        env: { ...process.env, NODE_ENV: 'production' }
      });
      let serverReady = false;
      const timeout = setTimeout(() => {
        if (!serverReady) {
          const msg = 'Backend server failed to start (timeout). Check backend.log in your home directory for details.';
          console.error(msg);
          dialog.showErrorBox('Backend Startup Error', msg);
          reject(new Error(msg));
        }
      }, 30000);
      backendProcess.on('error', (error) => {
        const msg = `Backend process spawn error: ${error.message}`;
        console.error(msg);
        dialog.showErrorBox('Backend Spawn Error', msg);
        clearTimeout(timeout);
        reject(error);
      });
      backendProcess.on('exit', (code, signal) => {
        console.log(`Backend process exited with code: ${code}, signal: ${signal}`);
      });
      backendProcess.on('error', (error) => {
        console.error('Backend process error:', error);
      });
      // Listen for server ready by polling health endpoint
      const checkReady = () => {
        const http = require('http');
        const req = http.request({ hostname: 'localhost', port: 3000, path: '/api/auth/health', method: 'GET', timeout: 1000 }, (res) => {
          if (res.statusCode === 200 || res.statusCode === 404) {
            serverReady = true;
            clearTimeout(timeout);
            resolve();
          } else {
            setTimeout(checkReady, 500);
          }
        });
        req.on('error', () => setTimeout(checkReady, 500));
        req.on('timeout', () => { req.destroy(); setTimeout(checkReady, 500); });
        req.end();
      };
      checkReady();
    } catch (err) {
      const msg = `Exception during backend startup: ${err.message}`;
      console.error(msg);
      dialog.showErrorBox('Backend Startup Exception', msg);
      reject(err);
    }
  });
}

async function cleanup() {
  console.log('🧹 Cleaning up...');
  
  try {
    // Stop backend server
    if (backendProcess) {
      console.log('⚠️  Stopping backend server...');
      backendProcess.kill('SIGTERM');
      
      // Wait a bit for graceful shutdown
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Force kill if still running
      if (!backendProcess.killed) {
        backendProcess.kill('SIGKILL');
      }
    }
    
    console.log('✅ Cleanup completed');
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  }
}

function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New Loan',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow.webContents.send('menu-new');
          }
        },
        {
          label: 'Open Member',
          accelerator: 'CmdOrCtrl+O',
          click: () => {
            mainWindow.webContents.send('menu-open');
          }
        },
        { type: 'separator' },
        {
          label: 'Save Report',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            mainWindow.webContents.send('menu-save');
          }
        },
        { type: 'separator' },
        {
          label: 'Exit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectall' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'close' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About Loan Management',
              message: 'Loan Management Desktop Application',
              detail: `Version: ${app.getVersion()}\n\nA comprehensive loan management system for desktop use.`
            });
          }
        },
        { type: 'separator' },
        {
          label: 'Documentation',
          click: () => {
            shell.openExternal('https://github.com/your-repo/docs');
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// IPC Handlers
ipcMain.handle('window-minimize', () => {
  mainWindow.minimize();
});

ipcMain.handle('window-maximize', () => {
  if (mainWindow.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow.maximize();
  }
});

ipcMain.handle('window-close', () => {
  mainWindow.close();
});

ipcMain.handle('show-open-dialog', async (event, options) => {
  const result = await dialog.showOpenDialog(mainWindow, options);
  return result;
});

ipcMain.handle('show-save-dialog', async (event, options) => {
  const result = await dialog.showSaveDialog(mainWindow, options);
  return result;
});

ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

// App ready event
app.whenReady().then(() => {
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('before-quit', async () => {
  app.isQuiting = true;
  await cleanup();
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  dialog.showErrorBox('Application Error', `An unexpected error occurred:\n${error.message}`);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  dialog.showErrorBox('Application Error', `An unexpected error occurred:\n${reason}`);
}); 