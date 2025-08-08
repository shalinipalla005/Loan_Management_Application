const { spawn } = require('child_process');
const path = require('path');
const { app } = require('electron');
const environment = require('./environment');

class ServerManager {
  constructor() {
    this.serverProcess = null;
    this.serverPort = environment.get('SERVER_PORT', 3000);
    this.isRunning = false;
  }

  async startServer() {
    if (this.isRunning) {
      console.log('⚠️  Server is already running');
      return;
    }

    console.log('🚀 Starting backend server...');

    try {
      const serverPath = path.join(__dirname, '../../backend/server.js');
      
      // Set environment variables for desktop mode
      const env = environment.getBackendEnvironment();

      // Start the server process
      this.serverProcess = spawn('node', [serverPath], {
        env,
        stdio: ['pipe', 'pipe', 'pipe'],
        detached: false
      });

      // Handle server output
      this.serverProcess.stdout.on('data', (data) => {
        console.log(`[Server] ${data.toString().trim()}`);
      });

      this.serverProcess.stderr.on('data', (data) => {
        console.error(`[Server Error] ${data.toString().trim()}`);
      });

      // Handle server exit
      this.serverProcess.on('close', (code) => {
        console.log(`[Server] Process exited with code ${code}`);
        this.isRunning = false;
        this.serverProcess = null;
      });

      this.serverProcess.on('error', (error) => {
        console.error('[Server] Failed to start server:', error);
        this.isRunning = false;
        this.serverProcess = null;
      });

      // Wait a bit for server to start
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      this.isRunning = true;
      console.log('✅ Backend server started successfully');

    } catch (error) {
      console.error('❌ Failed to start server:', error);
      this.isRunning = false;
      throw error;
    }
  }

  async stopServer() {
    if (!this.isRunning || !this.serverProcess) {
      console.log('⚠️  Server is not running');
      return;
    }

    console.log('🛑 Stopping backend server...');

    try {
      // Kill the server process
      this.serverProcess.kill('SIGTERM');
      
      // Wait for process to terminate
      await new Promise((resolve) => {
        this.serverProcess.on('close', () => {
          resolve();
        });
        
        // Force kill after 5 seconds
        setTimeout(() => {
          if (this.serverProcess) {
            this.serverProcess.kill('SIGKILL');
          }
          resolve();
        }, 5000);
      });

      this.isRunning = false;
      this.serverProcess = null;
      console.log('✅ Backend server stopped successfully');

    } catch (error) {
      console.error('❌ Failed to stop server:', error);
      throw error;
    }
  }

  isServerRunning() {
    return this.isRunning && this.serverProcess && !this.serverProcess.killed;
  }

  getServerUrl() {
    return `http://localhost:${this.serverPort}`;
  }

  async restartServer() {
    console.log('🔄 Restarting backend server...');
    await this.stopServer();
    await this.startServer();
  }
}

module.exports = new ServerManager(); 