const { Sequelize } = require('sequelize');
const path = require('path');

const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

let sequelize;

if (isProduction) {
  // Desktop production mode - use SQLite from user data directory
  const os = require('os');
  const userDataPath = path.join(os.homedir(), '.loan-management');
  const dbPath = process.env.DATABASE_PATH || path.join(userDataPath, 'loan_management.db');
  
  // Ensure the directory exists
  const fs = require('fs');
  if (!fs.existsSync(userDataPath)) {
    fs.mkdirSync(userDataPath, { recursive: true });
  }
  
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: dbPath,
    logging: false, // Disable logging in production
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  });
  
} else {
  // Development mode - use SQLite in models directory (same as Electron)
  const dbPath = path.join(__dirname, '../models/loan_management.db');
  
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: dbPath,
    logging: console.log, // Enable logging in development
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  });
}

// Test the connection
sequelize
  .authenticate()
  .then(() => {
    console.log('Database connection has been established successfully.');
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });

module.exports = sequelize;
