const { sequelize } = require('../models');
const { 
  Member, 
  Loan, 
  Society, 
  LoanOfficer, 
  LoanProduct, 
  RepaymentSchedule, 
  Payment, 
  MemberSavings, 
  Penalty, 
  LoanStatusHistory, 
  MemberDocument, 
  AuditLog 
} = require('../models');

async function flushDatabase() {
  try {
    console.log('🔄 Starting database flush...');
    
    // Disable foreign key checks temporarily (SQLite syntax)
    await sequelize.query('PRAGMA foreign_keys = OFF');
    
    // Clear tables in correct order (respecting foreign key constraints)
    const tables = [
      'audit_logs',
      'member_documents', 
      'loan_status_history',
      'penalties',
      'member_savings',
      'payments',
      'repayment_schedule',
      'loans',
      'loan_products',
      'loan_officers',
      'members',
      'societies'
    ];
    
    console.log('🗑️  Clearing tables...');
    for (const table of tables) {
      try {
        await sequelize.query(`DELETE FROM ${table}`);
        console.log(`✅ Cleared table: ${table}`);
      } catch (error) {
        console.log(`⚠️  Could not clear table ${table}: ${error.message}`);
      }
    }
    
    // Re-enable foreign key checks
    await sequelize.query('PRAGMA foreign_keys = ON');
    
    // Reset auto-increment counters (SQLite syntax)
    console.log('🔄 Resetting auto-increment counters...');
    const resetQueries = [
      'DELETE FROM sqlite_sequence WHERE name = "societies"',
      'DELETE FROM sqlite_sequence WHERE name = "members"', 
      'DELETE FROM sqlite_sequence WHERE name = "loan_officers"',
      'DELETE FROM sqlite_sequence WHERE name = "loan_products"',
      'DELETE FROM sqlite_sequence WHERE name = "loans"',
      'DELETE FROM sqlite_sequence WHERE name = "repayment_schedule"',
      'DELETE FROM sqlite_sequence WHERE name = "payments"',
      'DELETE FROM sqlite_sequence WHERE name = "member_savings"',
      'DELETE FROM sqlite_sequence WHERE name = "penalties"',
      'DELETE FROM sqlite_sequence WHERE name = "loan_status_history"',
      'DELETE FROM sqlite_sequence WHERE name = "member_documents"',
      'DELETE FROM sqlite_sequence WHERE name = "audit_logs"'
    ];
    
    for (const query of resetQueries) {
      try {
        await sequelize.query(query);
        const tableName = query.match(/"([^"]+)"/)[1];
        console.log(`✅ Reset counter: ${tableName}`);
      } catch (error) {
        console.log(`⚠️  Could not reset counter: ${error.message}`);
      }
    }
    
    console.log('🎉 Database flush completed successfully!');
    console.log('📝 All data has been cleared and auto-increment counters reset.');
    console.log('🚀 The application is now ready for fresh data entry.');
    
  } catch (error) {
    console.error('❌ Error during database flush:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Run the flush if this script is executed directly
if (require.main === module) {
  flushDatabase()
    .then(() => {
      console.log('✅ Database flush script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Database flush script failed:', error);
      process.exit(1);
    });
}

module.exports = flushDatabase;
