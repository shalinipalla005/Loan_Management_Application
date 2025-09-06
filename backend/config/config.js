require('dotenv').config();

// Determine database configuration based on environment
const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development';

// Database URL configuration
let databaseUrl;
if (isProduction && process.env.DATABASE_URL) {
  // Production: Use PostgreSQL from Render
  databaseUrl = process.env.DATABASE_URL;
} else if (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgres://')) {
  // Development with PostgreSQL
  databaseUrl = process.env.DATABASE_URL;
} else {
  // Default: Use SQLite for local development
  databaseUrl = process.env.DATABASE_URL || 'sqlite:./models/loan_management.db';
}

// Parse PostgreSQL URL for individual components
let dbConfig = {};
if (databaseUrl.startsWith('postgres://')) {
  const url = new URL(databaseUrl);
  dbConfig = {
    username: url.username,
    password: url.password,
    database: url.pathname.slice(1),
    host: url.hostname,
    port: url.port || 5432,
    dialect: 'postgres',
    dialectOptions: {
      ssl: isProduction ? { require: true, rejectUnauthorized: false } : false
    }
  };
} else {
  // SQLite configuration
  dbConfig = {
    username: null,
    password: null,
    database: './models/loan_management.db',
    host: null,
    dialect: 'sqlite',
    storage: './models/loan_management.db'
  };
}

module.exports = {
  // Server configuration
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',

  // Database configuration
  databaseUrl: databaseUrl,
  dbConfig: dbConfig,

  // JWT configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-key-change-this-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },

  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || 'debug',
  },

  // Sequelize CLI configuration
  development: {
    ...dbConfig,
    database: isDevelopment && !databaseUrl.startsWith('postgres://') 
      ? './models/loan_management.db' 
      : dbConfig.database,
    storage: isDevelopment && !databaseUrl.startsWith('postgres://') 
      ? './models/loan_management.db' 
      : undefined
  },
  test: {
    username: null,
    password: null,
    database: './models/loan_management_test.db',
    host: null,
    dialect: 'sqlite',
    storage: './models/loan_management_test.db'
  },
  production: dbConfig
};
