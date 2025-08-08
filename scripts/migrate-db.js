const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

class DatabaseMigrator {
  constructor() {
    this.sourceDbPath = path.join(__dirname, '../backend/models/loan_management.db');
    this.targetDbPath = path.join(__dirname, '../resources/database/app.db');
  }

  async migrate() {
    console.log('🔄 Starting database migration to SQLite...');
    
    try {
      // Step 1: Check if source database exists
      if (!fs.existsSync(this.sourceDbPath)) {
        console.log('⚠️  Source database not found, creating new database...');
        await this.createNewDatabase();
        return;
      }
      
      // Step 2: Extract schema and data from existing database
      const schema = await this.extractSchema();
      const data = await this.extractData();
      
      // Step 3: Create new SQLite database
      await this.createSQLiteDatabase(schema, data);
      
      // Step 4: Verify migration
      await this.verifyMigration();
      
      console.log('✅ Database migration completed successfully!');
      
    } catch (error) {
      console.error('❌ Database migration failed:', error);
      throw error;
    }
  }

  async createNewDatabase() {
    console.log('🔧 Creating new database with schema...');
    
    const dbPath = this.targetDbPath;
    
    // Ensure directory exists
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
          reject(err);
          return;
        }
        
        // Enable foreign keys and WAL mode for better performance
        db.run('PRAGMA foreign_keys = ON');
        db.run('PRAGMA journal_mode = WAL');
        
        // Create tables based on Sequelize models
        this.createTablesFromModels(db)
          .then(() => {
            db.close();
            console.log('✅ New database created successfully');
            resolve();
          })
          .catch(reject);
      });
    });
  }

  async createTablesFromModels(db) {
    return new Promise((resolve, reject) => {
      // Create tables based on your Sequelize models
      const createTableQueries = [
        // Societies table
        `CREATE TABLE IF NOT EXISTS Societies (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          address TEXT,
          phone TEXT,
          email TEXT,
          registrationNumber TEXT,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
        
        // Members table
        `CREATE TABLE IF NOT EXISTS Members (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          memberId TEXT UNIQUE NOT NULL,
          firstName TEXT NOT NULL,
          lastName TEXT NOT NULL,
          email TEXT,
          phone TEXT,
          address TEXT,
          dateOfBirth DATE,
          membershipDate DATE,
          status TEXT DEFAULT 'active',
          societyId INTEGER,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (societyId) REFERENCES Societies(id)
        )`,
        
        // Loan Officers table
        `CREATE TABLE IF NOT EXISTS LoanOfficers (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          officerId TEXT UNIQUE NOT NULL,
          firstName TEXT NOT NULL,
          lastName TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          phone TEXT,
          password TEXT NOT NULL,
          role TEXT DEFAULT 'officer',
          status TEXT DEFAULT 'active',
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
        
        // Loan Products table
        `CREATE TABLE IF NOT EXISTS LoanProducts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          productId TEXT UNIQUE NOT NULL,
          name TEXT NOT NULL,
          description TEXT,
          interestRate DECIMAL(5,2) NOT NULL,
          maxAmount DECIMAL(15,2) NOT NULL,
          minAmount DECIMAL(15,2) NOT NULL,
          maxTerm INTEGER NOT NULL,
          minTerm INTEGER NOT NULL,
          status TEXT DEFAULT 'active',
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
        
        // Loans table
        `CREATE TABLE IF NOT EXISTS Loans (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          loanId TEXT UNIQUE NOT NULL,
          memberId INTEGER NOT NULL,
          productId INTEGER NOT NULL,
          officerId INTEGER NOT NULL,
          amount DECIMAL(15,2) NOT NULL,
          interestRate DECIMAL(5,2) NOT NULL,
          term INTEGER NOT NULL,
          status TEXT DEFAULT 'pending',
          disbursementDate DATE,
          dueDate DATE,
          cleared BOOLEAN DEFAULT 0,
          clearedDate DATE,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (memberId) REFERENCES Members(id),
          FOREIGN KEY (productId) REFERENCES LoanProducts(id),
          FOREIGN KEY (officerId) REFERENCES LoanOfficers(id)
        )`,
        
        // Payments table
        `CREATE TABLE IF NOT EXISTS Payments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          paymentId TEXT UNIQUE NOT NULL,
          loanId INTEGER NOT NULL,
          amount DECIMAL(15,2) NOT NULL,
          paymentDate DATE NOT NULL,
          paymentType TEXT DEFAULT 'regular',
          reference TEXT,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (loanId) REFERENCES Loans(id)
        )`,
        
        // Penalties table
        `CREATE TABLE IF NOT EXISTS Penalties (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          penaltyId TEXT UNIQUE NOT NULL,
          loanId INTEGER NOT NULL,
          amount DECIMAL(15,2) NOT NULL,
          reason TEXT,
          penaltyDate DATE NOT NULL,
          status TEXT DEFAULT 'pending',
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (loanId) REFERENCES Loans(id)
        )`,
        
        // Repayment Schedule table
        `CREATE TABLE IF NOT EXISTS RepaymentSchedules (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          loanId INTEGER NOT NULL,
          installmentNumber INTEGER NOT NULL,
          dueDate DATE NOT NULL,
          amount DECIMAL(15,2) NOT NULL,
          principal DECIMAL(15,2) NOT NULL,
          interest DECIMAL(15,2) NOT NULL,
          balance DECIMAL(15,2) NOT NULL,
          status TEXT DEFAULT 'pending',
          paidAmount DECIMAL(15,2) DEFAULT 0,
          paidDate DATE,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (loanId) REFERENCES Loans(id)
        )`,
        
        // Member Documents table
        `CREATE TABLE IF NOT EXISTS MemberDocuments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          memberId INTEGER NOT NULL,
          documentType TEXT NOT NULL,
          fileName TEXT NOT NULL,
          filePath TEXT NOT NULL,
          uploadDate DATETIME DEFAULT CURRENT_TIMESTAMP,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (memberId) REFERENCES Members(id)
        )`,
        
        // Member Savings table
        `CREATE TABLE IF NOT EXISTS MemberSavings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          memberId INTEGER NOT NULL,
          amount DECIMAL(15,2) NOT NULL,
          transactionType TEXT NOT NULL,
          transactionDate DATE NOT NULL,
          reference TEXT,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (memberId) REFERENCES Members(id)
        )`,
        
        // Loan Status History table
        `CREATE TABLE IF NOT EXISTS LoanStatusHistory (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          loanId INTEGER NOT NULL,
          status TEXT NOT NULL,
          changedBy INTEGER NOT NULL,
          changedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          notes TEXT,
          FOREIGN KEY (loanId) REFERENCES Loans(id),
          FOREIGN KEY (changedBy) REFERENCES LoanOfficers(id)
        )`,
        
        // Audit Log table
        `CREATE TABLE IF NOT EXISTS AuditLogs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          userId INTEGER,
          action TEXT NOT NULL,
          tableName TEXT,
          recordId INTEGER,
          oldValues TEXT,
          newValues TEXT,
          ipAddress TEXT,
          userAgent TEXT,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )`
      ];
      
      let completed = 0;
      const total = createTableQueries.length;
      
      createTableQueries.forEach(query => {
        db.run(query, (err) => {
          if (err) {
            reject(err);
            return;
          }
          
          completed++;
          if (completed === total) {
            // Insert default data
            this.insertDefaultData(db)
              .then(resolve)
              .catch(reject);
          }
        });
      });
    });
  }

  async insertDefaultData(db) {
    return new Promise((resolve, reject) => {
      // Insert default loan officer
      const insertOfficer = `INSERT OR IGNORE INTO LoanOfficers (officerId, firstName, lastName, email, password, role)
        VALUES (?, ?, ?, ?, ?, ?)`;
      
      db.run(insertOfficer, [
        'LO001',
        'Admin',
        'User',
        'admin@loanmanagement.com',
        '$2b$10$rQZ8K9vX2mN3pL4qR5sT6uV7wX8yZ9aA0bB1cC2dE3fF4gG5hH6iI7jJ8kK9lL0mM1nN2oO3pP4qQ5rR6sS7tT8uU9vV0wW1xX2yY3zZ4aA5bB6cC7dD8eE9fF0gG1hH2iI3jJ4kK5lL6mM7nN8oO9pP0qQ1rR2sS3tT4uU5vV6wW7xX8yY9zZ',
        'admin'
      ], (err) => {
        if (err) {
          reject(err);
          return;
        }
        
        // Insert default society
        const insertSociety = `INSERT OR IGNORE INTO Societies (name, address, phone, email, registrationNumber)
          VALUES (?, ?, ?, ?, ?)`;
        
        db.run(insertSociety, [
          'Default Society',
          '123 Main Street, City, State',
          '+1234567890',
          'info@defaultsociety.com',
          'REG001'
        ], (err) => {
          if (err) {
            reject(err);
            return;
          }
          
          // Insert sample loan product
          const insertProduct = `INSERT OR IGNORE INTO LoanProducts (productId, name, description, interestRate, maxAmount, minAmount, maxTerm, minTerm)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
          
          db.run(insertProduct, [
            'LP001',
            'Personal Loan',
            'Standard personal loan product',
            12.5,
            100000.00,
            1000.00,
            60,
            6
          ], (err) => {
            if (err) {
              reject(err);
              return;
            }
            
            resolve();
          });
        });
      });
    });
  }

  async extractSchema() {
    console.log('📋 Extracting schema from existing database...');
    
    if (!fs.existsSync(this.sourceDbPath)) {
      throw new Error('Source database not found');
    }
    
    return new Promise((resolve, reject) => {
      const sourceDb = new sqlite3.Database(this.sourceDbPath, sqlite3.OPEN_READONLY, (err) => {
        if (err) {
          reject(err);
          return;
        }
        
        sourceDb.all(`
          SELECT name FROM sqlite_master 
          WHERE type='table' AND name NOT LIKE 'sqlite_%'
          ORDER BY name
        `, (err, tables) => {
          if (err) {
            sourceDb.close();
            reject(err);
            return;
          }
          
          const schema = { tables: [] };
          let completed = 0;
          
          if (tables.length === 0) {
            sourceDb.close();
            resolve(schema);
            return;
          }
          
          tables.forEach(table => {
            sourceDb.all(`PRAGMA table_info(${table.name})`, (err, columns) => {
              if (err) {
                sourceDb.close();
                reject(err);
                return;
              }
              
              schema.tables.push({
                name: table.name,
                columns: columns.map(col => ({
                  name: col.name,
                  type: col.type,
                  isPrimaryKey: col.pk === 1,
                  isNullable: col.notnull === 0,
                  defaultValue: col.dflt_value
                }))
              });
              
              completed++;
              if (completed === tables.length) {
                sourceDb.close();
                resolve(schema);
              }
            });
          });
        });
      });
    });
  }

  async extractData() {
    console.log('📊 Extracting data from existing database...');
    
    return new Promise((resolve, reject) => {
      const sourceDb = new sqlite3.Database(this.sourceDbPath, sqlite3.OPEN_READONLY, (err) => {
        if (err) {
          reject(err);
          return;
        }
        
        sourceDb.all(`
          SELECT name FROM sqlite_master 
          WHERE type='table' AND name NOT LIKE 'sqlite_%'
          ORDER BY name
        `, (err, tables) => {
          if (err) {
            sourceDb.close();
            reject(err);
            return;
          }
          
          const data = { tables: [] };
          let completed = 0;
          
          if (tables.length === 0) {
            sourceDb.close();
            resolve(data);
            return;
          }
          
          tables.forEach(table => {
            sourceDb.all(`SELECT * FROM ${table.name}`, (err, rows) => {
              if (err) {
                sourceDb.close();
                reject(err);
                return;
              }
              
              data.tables.push({
                name: table.name,
                rows: rows
              });
              
              completed++;
              if (completed === tables.length) {
                sourceDb.close();
                resolve(data);
              }
            });
          });
        });
      });
    });
  }

  async createSQLiteDatabase(schema, data) {
    console.log('💾 Creating new SQLite database...');
    
    const dbPath = this.targetDbPath;
    
    // Ensure directory exists
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
          reject(err);
          return;
        }
        
        // Enable foreign keys and WAL mode for better performance
        db.run('PRAGMA foreign_keys = ON');
        db.run('PRAGMA journal_mode = WAL');
        
        // Create tables
        let tableCompleted = 0;
        const totalTables = schema.tables.length;
        
        if (totalTables === 0) {
          db.close();
          resolve(dbPath);
          return;
        }
        
        schema.tables.forEach(table => {
          const createTableSQL = this.generateCreateTableSQL(table);
          db.run(createTableSQL, (err) => {
            if (err) {
              db.close();
              reject(err);
              return;
            }
            
            tableCompleted++;
            if (tableCompleted === totalTables) {
              // Insert data
              this.insertData(db, data, resolve, reject);
            }
          });
        });
      });
    });
  }

  insertData(db, data, resolve, reject) {
    let dataCompleted = 0;
    const totalData = data.tables.length;
    
    if (totalData === 0) {
      db.close();
      resolve();
      return;
    }
    
    data.tables.forEach(table => {
      if (table.rows.length > 0) {
        const columns = Object.keys(table.rows[0]);
        const placeholders = columns.map(() => '?').join(',');
        const insertSQL = `INSERT INTO ${table.name} (${columns.join(',')}) VALUES (${placeholders})`;
        
        let rowCompleted = 0;
        const totalRows = table.rows.length;
        
        table.rows.forEach(row => {
          db.run(insertSQL, Object.values(row), (err) => {
            if (err) {
              db.close();
              reject(err);
              return;
            }
            
            rowCompleted++;
            if (rowCompleted === totalRows) {
              dataCompleted++;
              if (dataCompleted === totalData) {
                db.close();
                resolve();
              }
            }
          });
        });
      } else {
        dataCompleted++;
        if (dataCompleted === totalData) {
          db.close();
          resolve();
        }
      }
    });
  }

  generateCreateTableSQL(table) {
    let sql = `CREATE TABLE IF NOT EXISTS ${table.name} (\n`;
    
    const columns = table.columns.map(col => {
      let colDef = `  ${col.name} ${col.type}`;
      if (col.isPrimaryKey) colDef += ' PRIMARY KEY';
      if (!col.isNullable) colDef += ' NOT NULL';
      if (col.defaultValue !== null) colDef += ` DEFAULT ${col.defaultValue}`;
      return colDef;
    });
    
    sql += columns.join(',\n');
    sql += '\n);';
    
    return sql;
  }

  async verifyMigration() {
    console.log('🔍 Verifying migration...');
    
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(this.targetDbPath, sqlite3.OPEN_READONLY, (err) => {
        if (err) {
          reject(err);
          return;
        }
        
        db.all(`
          SELECT name FROM sqlite_master 
          WHERE type='table' AND name NOT LIKE 'sqlite_%'
          ORDER BY name
        `, (err, tables) => {
          if (err) {
            db.close();
            reject(err);
            return;
          }
          
          console.log(`✅ Migration verified. Found ${tables.length} tables:`);
          
          let completed = 0;
          const total = tables.length;
          
          if (total === 0) {
            db.close();
            resolve();
            return;
          }
          
          tables.forEach(table => {
            db.get(`SELECT COUNT(*) as count FROM ${table.name}`, (err, row) => {
              if (err) {
                db.close();
                reject(err);
                return;
              }
              
              console.log(`  - ${table.name}: ${row.count} rows`);
              
              completed++;
              if (completed === total) {
                db.close();
                resolve();
              }
            });
          });
        });
      });
    });
  }
}

// Execute migration if run directly
if (require.main === module) {
  const migrator = new DatabaseMigrator();
  migrator.migrate().catch(console.error);
}

module.exports = DatabaseMigrator; 