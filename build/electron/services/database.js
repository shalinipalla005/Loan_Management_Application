const { app } = require('electron');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class DatabaseManager {
  constructor() {
    this.db = null;
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) return;
    
    console.log('💾 Initializing database...');
    
    try {
      const dbPath = this.getDatabasePath();
      const dbExists = fs.existsSync(dbPath);
      
      // Create database connection
      await this.createDatabaseConnection(dbPath);
      
      // Initialize schema if database is new
      if (!dbExists) {
        await this.initializeSchema();
      }
      
      this.isInitialized = true;
      console.log('✅ Database initialized successfully');
      
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      throw error;
    }
  }

  createDatabaseConnection(dbPath) {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
          reject(err);
          return;
        }
        
        // Configure database
        this.db.run('PRAGMA foreign_keys = ON');
        this.db.run('PRAGMA journal_mode = WAL');
        this.db.run('PRAGMA synchronous = NORMAL');
        this.db.run('PRAGMA cache_size = 1000');
        
        resolve();
      });
    });
  }

  getDatabasePath() {
    const userDataPath = app.getPath('userData');
    return path.join(userDataPath, 'loan_management.db');
  }

  async initializeSchema() {
    console.log('🔧 Initializing database schema...');
    
    try {
      // Copy template database from resources
      const templateDbPath = path.join(process.resourcesPath, 'database', 'app.db');
      
      if (fs.existsSync(templateDbPath)) {
        await this.copyFromTemplate(templateDbPath);
      }
      
      console.log('✅ Database schema initialized');
      
    } catch (error) {
      console.error('❌ Schema initialization failed:', error);
      throw error;
    }
  }

  copyFromTemplate(templateDbPath) {
    return new Promise((resolve, reject) => {
      const templateDb = new sqlite3.Database(templateDbPath, sqlite3.OPEN_READONLY, (err) => {
        if (err) {
          reject(err);
          return;
        }
        
        templateDb.all(`
          SELECT name FROM sqlite_master 
          WHERE type='table' AND name NOT LIKE 'sqlite_%'
        `, (err, tables) => {
          if (err) {
            templateDb.close();
            reject(err);
            return;
          }
          
          let completed = 0;
          const total = tables.length;
          
          if (total === 0) {
            templateDb.close();
            resolve();
            return;
          }
          
          tables.forEach(table => {
            templateDb.all(`SELECT * FROM ${table.name}`, (err, rows) => {
              if (err) {
                templateDb.close();
                reject(err);
                return;
              }
              
              if (rows.length > 0) {
                const columns = Object.keys(rows[0]);
                const placeholders = columns.map(() => '?').join(',');
                const insertSQL = `INSERT INTO ${table.name} (${columns.join(',')}) VALUES (${placeholders})`;
                
                let rowCompleted = 0;
                const totalRows = rows.length;
                
                rows.forEach(row => {
                  this.db.run(insertSQL, Object.values(row), (err) => {
                    if (err) {
                      templateDb.close();
                      reject(err);
                      return;
                    }
                    
                    rowCompleted++;
                    if (rowCompleted === totalRows) {
                      completed++;
                      if (completed === total) {
                        templateDb.close();
                        resolve();
                      }
                    }
                  });
                });
              } else {
                completed++;
                if (completed === total) {
                  templateDb.close();
                  resolve();
                }
              }
            });
          });
        });
      });
    });
  }

  async close() {
    if (this.db) {
      console.log('🔒 Closing database connection...');
      return new Promise((resolve) => {
        this.db.close((err) => {
          if (err) {
            console.error('Error closing database:', err);
          }
          this.db = null;
          this.isInitialized = false;
          resolve();
        });
      });
    }
  }

  getDatabase() {
    if (!this.isInitialized) {
      throw new Error('Database not initialized');
    }
    return this.db;
  }
}

module.exports = new DatabaseManager(); 