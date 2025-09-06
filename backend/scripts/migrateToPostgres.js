const { Sequelize } = require('sequelize');
const fs = require('fs');
const path = require('path');

// SQLite connection for reading existing data
const sqliteSequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './models/loan_management.db',
  logging: false
});

// PostgreSQL connection (will be set from environment)
let postgresSequelize;

async function initializePostgresConnection() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  postgresSequelize = new Sequelize(databaseUrl, {
    dialect: 'postgres',
    dialectOptions: {
      ssl: process.env.NODE_ENV === 'production' ? { require: true, rejectUnauthorized: false } : false
    },
    logging: console.log
  });

  await postgresSequelize.authenticate();
  console.log('PostgreSQL connection established successfully.');
}

async function migrateData() {
  try {
    console.log('Starting data migration from SQLite to PostgreSQL...');

    // Initialize PostgreSQL connection
    await initializePostgresConnection();

    // Test SQLite connection
    await sqliteSequelize.authenticate();
    console.log('SQLite connection established successfully.');

    // Get all table names from SQLite
    const [tables] = await sqliteSequelize.query(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `);

    console.log('Found tables:', tables.map(t => t.name));

    // Create tables in PostgreSQL using existing migrations
    console.log('Creating tables in PostgreSQL...');
    await postgresSequelize.sync({ force: false });

    // Migrate data table by table
    for (const table of tables) {
      const tableName = table.name;
      console.log(`\nMigrating table: ${tableName}`);

      try {
        // Get all data from SQLite table
        const [rows] = await sqliteSequelize.query(`SELECT * FROM ${tableName}`);
        
        if (rows.length === 0) {
          console.log(`  No data found in ${tableName}, skipping...`);
          continue;
        }

        console.log(`  Found ${rows.length} rows in ${tableName}`);

        // Insert data into PostgreSQL
        for (const row of rows) {
          try {
            await postgresSequelize.query(
              `INSERT INTO ${tableName} (${Object.keys(row).join(', ')}) VALUES (${Object.keys(row).map(() => '?').join(', ')})`,
              {
                replacements: Object.values(row),
                type: Sequelize.QueryTypes.INSERT
              }
            );
          } catch (error) {
            if (error.message.includes('duplicate key') || error.message.includes('UNIQUE constraint')) {
              console.log(`    Skipping duplicate row in ${tableName}`);
            } else {
              console.error(`    Error inserting row in ${tableName}:`, error.message);
            }
          }
        }

        console.log(`  Successfully migrated ${tableName}`);
      } catch (error) {
        console.error(`  Error migrating table ${tableName}:`, error.message);
      }
    }

    console.log('\nData migration completed successfully!');

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    // Close connections
    if (sqliteSequelize) await sqliteSequelize.close();
    if (postgresSequelize) await postgresSequelize.close();
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateData();
}

module.exports = { migrateData };
