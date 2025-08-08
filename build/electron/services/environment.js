const { app } = require('electron');
const path = require('path');
const fs = require('fs');

class EnvironmentManager {
  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.isProduction = process.env.NODE_ENV === 'production';
    this.config = this.loadConfiguration();
  }

  loadConfiguration() {
    const baseConfig = {
      // App Configuration
      APP_NAME: 'Loan Management',
      APP_VERSION: app.getVersion(),
      
      // Server Configuration
      SERVER_PORT: 3000,
      SERVER_HOST: 'localhost',
      
      // Database Configuration
      DATABASE_PATH: path.join(app.getPath('userData'), 'loan_management.db'),
      
      // JWT Configuration
      JWT_SECRET: 'your-super-secret-key-change-this-in-production',
      JWT_EXPIRES_IN: '24h',
      
      // Logging Configuration
      LOG_LEVEL: 'info',
      
      // File Upload Configuration
      UPLOAD_PATH: path.join(app.getPath('userData'), 'uploads'),
      MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
      
      // Security Configuration
      CORS_ORIGIN: 'http://localhost:5173', // Frontend URL in development
      
      // Auto-update Configuration
      AUTO_UPDATE_ENABLED: true,
      UPDATE_SERVER_URL: 'https://api.github.com/repos/your-username/loan-management-desktop/releases/latest'
    };

    // Override with development settings
    if (this.isDevelopment) {
      return {
        ...baseConfig,
        LOG_LEVEL: 'debug',
        CORS_ORIGIN: 'http://localhost:5173',
        JWT_SECRET: 'dev-secret-key',
        AUTO_UPDATE_ENABLED: false
      };
    }

    // Override with production settings
    if (this.isProduction) {
      return {
        ...baseConfig,
        CORS_ORIGIN: 'file://', // Allow file:// protocol for Electron
        LOG_LEVEL: 'warn',
        AUTO_UPDATE_ENABLED: true
      };
    }

    return baseConfig;
  }

  get(key, defaultValue = null) {
    // First check if it's set in the environment
    if (process.env[key] !== undefined) {
      return process.env[key];
    }
    
    // Then check our configuration
    if (this.config[key] !== undefined) {
      return this.config[key];
    }
    
    // Finally return default value
    return defaultValue;
  }

  set(key, value) {
    this.config[key] = value;
  }

  getAll() {
    return { ...this.config };
  }

  getBackendEnvironment() {
    return {
      ...process.env,
      NODE_ENV: this.isProduction ? 'production' : 'development',
      PORT: this.get('SERVER_PORT').toString(),
      DATABASE_PATH: this.get('DATABASE_PATH'),
      JWT_SECRET: this.get('JWT_SECRET'),
      JWT_EXPIRES_IN: this.get('JWT_EXPIRES_IN'),
      LOG_LEVEL: this.get('LOG_LEVEL'),
      UPLOAD_PATH: this.get('UPLOAD_PATH'),
      MAX_FILE_SIZE: this.get('MAX_FILE_SIZE').toString(),
      CORS_ORIGIN: this.get('CORS_ORIGIN')
    };
  }

  getFrontendEnvironment() {
    return {
      VITE_API_BASE_URL: `http://${this.get('SERVER_HOST')}:${this.get('SERVER_PORT')}`,
      VITE_APP_NAME: this.get('APP_NAME'),
      VITE_APP_VERSION: this.get('APP_VERSION'),
      VITE_IS_DESKTOP: 'true',
      VITE_AUTO_UPDATE_ENABLED: this.get('AUTO_UPDATE_ENABLED').toString()
    };
  }

  // Create necessary directories
  async ensureDirectories() {
    const directories = [
      path.dirname(this.get('DATABASE_PATH')),
      this.get('UPLOAD_PATH')
    ];

    for (const dir of directories) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }
  }

  // Load custom configuration from user data directory
  loadCustomConfig() {
    const configPath = path.join(app.getPath('userData'), 'config.json');
    
    if (fs.existsSync(configPath)) {
      try {
        const customConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        this.config = { ...this.config, ...customConfig };
        console.log('✅ Loaded custom configuration');
      } catch (error) {
        console.error('❌ Failed to load custom configuration:', error);
      }
    }
  }

  // Save custom configuration to user data directory
  saveCustomConfig() {
    const configPath = path.join(app.getPath('userData'), 'config.json');
    
    try {
      fs.writeFileSync(configPath, JSON.stringify(this.config, null, 2));
      console.log('✅ Saved custom configuration');
    } catch (error) {
      console.error('❌ Failed to save custom configuration:', error);
    }
  }
}

module.exports = new EnvironmentManager(); 