require('dotenv').config();

module.exports = {
  // Server configuration
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',

  // SQLite Database configuration (only)
  databaseUrl: process.env.DATABASE_URL || 'sqlite:./models/loan_management.db',

  // JWT configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-key-change-this-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },

  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || 'debug',
  },
};
