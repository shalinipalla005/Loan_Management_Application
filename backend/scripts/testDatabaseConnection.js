const { sequelize } = require('../models');

async function testConnection() {
  try {
    console.log('Testing database connection...');
    console.log('Database URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
    console.log('Node Environment:', process.env.NODE_ENV || 'development');
    
    await sequelize.authenticate();
    console.log('✅ Database connection successful!');
    
    // Test a simple query
    const [results] = await sequelize.query('SELECT 1 as test');
    console.log('✅ Database query test successful:', results);
    
    // Check if we're using PostgreSQL or SQLite
    const dialect = sequelize.getDialect();
    console.log('✅ Database dialect:', dialect);
    
    if (dialect === 'postgres') {
      console.log('✅ Using PostgreSQL database');
    } else {
      console.log('✅ Using SQLite database');
    }
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

testConnection();
