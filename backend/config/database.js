const { Sequelize } = require('sequelize');
const config = require('./config');

// Create Sequelize instance with appropriate configuration
let sequelize;
if (config.databaseUrl.startsWith('postgres://')) {
  // PostgreSQL configuration
  sequelize = new Sequelize(config.databaseUrl, {
    logging: config.nodeEnv === 'development' ? console.log : false,
    dialect: 'postgres',
    dialectOptions: config.dbConfig.dialectOptions || {},
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  });
} else {
  // SQLite configuration
  sequelize = new Sequelize(config.databaseUrl, {
    logging: config.nodeEnv === 'development' ? console.log : false,
    dialect: 'sqlite',
    storage: config.dbConfig.storage
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
