const { Sequelize } = require('sequelize');
const config = require('./config');
const path = require('path');

let sequelize;

if (config.databaseUrl) {
  sequelize = new Sequelize(config.databaseUrl, {
    logging: config.nodeEnv === 'development' ? console.log : false,
  });
} else {
  switch (config.database.type) {
    case 'sqlite':
      sequelize = new Sequelize({
        dialect: 'sqlite',
        storage: path.resolve(__dirname, '..', config.database.path),
        logging: config.nodeEnv === 'development' ? console.log : false,
      });
      break;
    case 'mysql':
      sequelize = new Sequelize(
        config.database.name,
        config.database.user,
        config.database.password,
        {
          host: config.database.host,
          port: config.database.port,
          dialect: 'mysql',
          logging: config.nodeEnv === 'development' ? console.log : false,
        }
      );
      break;
    case 'postgres':
      sequelize = new Sequelize(
        config.database.name,
        config.database.user,
        config.database.password,
        {
          host: config.database.host,
          port: config.database.port,
          dialect: 'postgres',
          logging: config.nodeEnv === 'development' ? console.log : false,
        }
      );
      break;
    default:
      throw new Error(`Unsupported database type: ${config.database.type}`);
  }
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
