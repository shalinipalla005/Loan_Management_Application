#!/usr/bin/env node

const flushDatabase = require('./flushDatabase');

console.log('🚨 WARNING: This will delete ALL data from the database!');
console.log('📋 This includes:');
console.log('   - All societies');
console.log('   - All members');
console.log('   - All loan officers');
console.log('   - All loans and loan products');
console.log('   - All payments and repayment schedules');
console.log('   - All penalties and savings records');
console.log('   - All audit logs and documents');
console.log('');
console.log('⚠️  This action cannot be undone!');
console.log('');

// Check if --force flag is provided
const args = process.argv.slice(2);
const forceFlag = args.includes('--force');

if (!forceFlag) {
  console.log('💡 To proceed, run: node clearData.js --force');
  console.log('🛑 Exiting for safety...');
  process.exit(0);
}

console.log('🔥 Proceeding with database flush...');
console.log('');

flushDatabase()
  .then(() => {
    console.log('');
    console.log('✅ Database has been successfully cleared!');
    console.log('🎯 You can now start fresh with the application.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('');
    console.error('❌ Failed to clear database:', error.message);
    process.exit(1);
  });
