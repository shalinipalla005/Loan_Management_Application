const express = require('express');
const cors = require('cors');
const { sequelize } = require('./models');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

const exportRoutes = require('./routes/exportRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const loanProfileRoutes = require('./routes/loanprofileRoutes');

// Initialize database and sync models
async function initializeDatabase() {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('Database connection established.');
    
    // Sync all models with the database
    await sequelize.sync({ alter: true });
    console.log('Database models synchronized.');
  } catch (error) {
    console.error('Database initialization error:', error);
    process.exit(1); // Exit if database initialization fails
  }
}

// Routes setup (to be added by team)
app.use('/api/members', require('./routes/memberRoutes'));
app.use('/api', exportRoutes);
app.use('/api', dashboardRoutes);
app.use('/api/loanprofiles', loanProfileRoutes);
// Add more routes here as they are created

// app.post('/api/loans/test-create', async (req, res) => {
//   try {
//     const Loan = require('./models/Loan');
//     const Member = require('./models/Member');
//     // Create a test member if not exists
//     let member = await Member.findOne({ where: { membership_number: 'TEST123' } });
//     if (!member) {
//       member = await Member.create({ member_name: 'Test User', membership_number: 'TEST123', society_id: 1 });
//     }
//     // Create a test loan
//     const loan = await Loan.create({
//       loan_number: 'LN001',
//       member_id: member.member_id,
//       society_id: 1,
//       officer_id: 1,
//       product_id: 1,
//       loan_amount: 10000,
//       interest_rate: 10,
//       tenure_months: 12,
//       processing_fee: 100,
//       monthly_savings: 200,
//       loan_status: 'PENDING'
//     });
//     res.json({ success: true, loan });
//   } catch (err) {
//     res.status(500).json({ success: false, error: err.message });
//   }
  
// });

// app.post('/api/test-create-foreign-keys', async (req, res) => {
//   try {
//     const Society = require('./models/Society');
//     const LoanOfficer = require('./models/LoanOfficer');
//     const LoanProduct = require('./models/LoanProduct');

//     await Society.findOrCreate({ where: { society_id: 1 }, defaults: { society_name: 'Test Society' } });
//     await LoanOfficer.findOrCreate({
//       where: { officer_id: 1 },
//       defaults: {
//         officer_name: 'Test Officer',
//         employee_id: 'EMP001' // <-- Add this line
//       }
//     });
//     await LoanProduct.findOrCreate({
//       where: { product_id: 1 },
//       defaults: {
//         product_name: 'Test Product 3',
//         interest_rate: 10,
//         processing_fee_rate: 1,
//         monthly_savings_required: 100,
//         society_id: 1 // <-- Add this line
//       }
//     });

//     res.json({ success: true, message: 'Foreign key records created or already exist.' });
//   } catch (err) {
//     res.status(500).json({ success: false, error: err.message });
//   }
// });

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: err.message 
  });
});

// Start server
const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    await initializeDatabase();
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app;
