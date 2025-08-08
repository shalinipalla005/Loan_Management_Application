const { autoUpdater } = require('electron-updater');
const { ipcMain, dialog } = require('electron');

class AutoUpdaterService {
  constructor() {
    this.mainWindow = null;
    this.setupAutoUpdater();
  }

  initialize(mainWindow) {
    this.mainWindow = mainWindow;
    
    // Check for updates on startup (after 5 seconds)
    setTimeout(() => {
      this.checkForUpdates();
    }, 5000);
  }

  setupAutoUpdater() {
    // Configure auto-updater
    autoUpdater.autoDownload = false;
    autoUpdater.autoInstallOnAppQuit = true;
    
    // Event handlers
    autoUpdater.on('checking-for-update', () => {
      console.log('🔍 Checking for updates...');
    });

    autoUpdater.on('update-available', (info) => {
      console.log('📥 Update available:', info.version);
      this.handleUpdateAvailable(info);
    });

    autoUpdater.on('update-not-available', () => {
      console.log('✅ App is up to date');
    });

    autoUpdater.on('error', (err) => {
      console.error('❌ Auto-updater error:', err);
    });

    autoUpdater.on('download-progress', (progress) => {
      console.log(`📥 Download progress: ${Math.round(progress.percent)}%`);
      if (this.mainWindow) {
        this.mainWindow.webContents.send('download-progress', progress);
      }
    });

    autoUpdater.on('update-downloaded', (info) => {
      console.log('✅ Update downloaded:', info.version);
      this.handleUpdateDownloaded(info);
    });
  }

  async checkForUpdates() {
    try {
      await autoUpdater.checkForUpdatesAndNotify();
    } catch (error) {
      console.error('Error checking for updates:', error);
    }
  }

  handleUpdateAvailable(info) {
    if (!this.mainWindow) return;
    
    const response = dialog.showMessageBoxSync(this.mainWindow, {
      type: 'info',
      title: 'Update Available',
      message: `A new version (${info.version}) is available!`,
      detail: 'Would you like to download it now?',
      buttons: ['Download', 'Later'],
      defaultId: 0
    });
    
    if (response === 0) {
      autoUpdater.downloadUpdate();
      
      // Show download progress
      this.mainWindow.webContents.send('update-download-started');
    }
  }

  handleUpdateDownloaded(info) {
    if (!this.mainWindow) return;
    
    const response = dialog.showMessageBoxSync(this.mainWindow, {
      type: 'info',
      title: 'Update Ready',
      message: `Update ${info.version} has been downloaded.`,
      detail: 'It will be installed when you restart the application.',
      buttons: ['Restart Now', 'Later'],
      defaultId: 0
    });
    
    if (response === 0) {
      autoUpdater.quitAndInstall();
    }
  }
}

module.exports = new AutoUpdaterService(); 