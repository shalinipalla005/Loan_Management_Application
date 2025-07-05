const express = require('express');
const cors = require('cors');
const { sequelize } = require('./models');

const outstandingInterestRoutes = require('./routes/outstandingInterestRoutes');

const { LoanOfficer } = require('./models');
const bcrypt = require('bcrypt');


const app = express();

// Middleware
app.use(cors());
app.use(express.json());

const exportRoutes = require('./routes/exportRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const loanProfileRoutes = require('./routes/loanprofileRoutes');
const authRoutes = require('./routes/authRoutes');
const penaltyRoutes = require('./routes/penaltyRoutes');
const loanProductRoutes = require('./routes/loanProductRoutes');
const loanRoutes = require('./routes/loanRoutes');
const repaymentScheduleRoutes = require('./routes/repaymentScheduleRoutes');
const societyRoutes = require('./routes/societyRoutes');
const loanOfficerRoutes = require('./routes/loanOfficerRoutes');
const loanStatusHistoryRoutes = require('./routes/loanStatusHistoryRoutes');
const memberDocumentRoutes = require('./routes/memberDocumentRoutes');
const auditLogRoutes = require('./routes/auditLogRoutes');
const reportRoutes = require('./routes/reportRoutes');

// Initialize database and sync models
async function initializeDatabase() {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('Database connection established.');
    
    // Note: Database schema is now managed through migrations
    // Run migrations with: npx sequelize-cli db:migrate
    console.log('Database models synchronized via migrations.');

    // --- CREATE TRIGGERS, VIEWS, AND INITIAL DATA ---
    // Enable foreign key constraints
    await sequelize.query('PRAGMA foreign_keys = ON;');

    // Triggers
    await sequelize.query(`
      CREATE TRIGGER IF NOT EXISTS update_loan_outstanding
      AFTER INSERT ON payments
      BEGIN
        UPDATE loans 
        SET outstanding_principal = outstanding_principal - NEW.principal_paid,
            outstanding_interest = outstanding_interest - NEW.interest_paid,
            updated_at = CURRENT_TIMESTAMP
        WHERE loan_id = NEW.loan_id;
        UPDATE repayment_schedule 
        SET payment_status = CASE 
            WHEN (NEW.principal_paid + NEW.interest_paid + NEW.savings_paid) >= total_installment 
            THEN 'PAID' 
            ELSE 'PARTIAL' 
        END,
        paid_date = NEW.payment_date,
        paid_amount = paid_amount + NEW.payment_amount
        WHERE schedule_id = NEW.schedule_id;
      END;
    `);
    await sequelize.query(`
      CREATE TRIGGER IF NOT EXISTS update_savings_balance
      AFTER INSERT ON member_savings
      BEGIN
        UPDATE member_savings 
        SET balance = (
            SELECT COALESCE(SUM(CASE WHEN transaction_type = 'DEPOSIT' OR transaction_type = 'INTEREST_CREDIT' 
                                   THEN amount ELSE -amount END), 0)
            FROM member_savings 
            WHERE member_id = NEW.member_id 
            AND savings_id <= NEW.savings_id
        )
        WHERE savings_id = NEW.savings_id;
      END;
    `);
    await sequelize.query(`
      CREATE TRIGGER IF NOT EXISTS log_loan_status_change
      AFTER UPDATE OF loan_status ON loans
      WHEN OLD.loan_status != NEW.loan_status
      BEGIN
        INSERT INTO loan_status_history (loan_id, old_status, new_status, changed_at)
        VALUES (NEW.loan_id, OLD.loan_status, NEW.loan_status, CURRENT_TIMESTAMP);
      END;
    `);

    // Views
    await sequelize.query(`
      CREATE VIEW IF NOT EXISTS loan_summary AS
      SELECT 
          l.loan_id,
          l.loan_number,
          m.member_name,
          m.membership_number,
          l.loan_amount,
          l.outstanding_principal,
          l.outstanding_interest,
          l.loan_status,
          l.disbursement_date,
          lo.officer_name,
          s.society_name,
          CASE 
              WHEN l.outstanding_principal = 0 THEN 'COMPLETED'
              WHEN EXISTS (
                  SELECT 1 FROM repayment_schedule rs 
                  WHERE rs.loan_id = l.loan_id 
                  AND rs.due_date < DATE('now') 
                  AND rs.payment_status = 'PENDING'
              ) THEN 'OVERDUE'
              ELSE 'CURRENT'
          END as payment_status
      FROM loans l
      JOIN members m ON l.member_id = m.member_id
      JOIN loan_officers lo ON l.officer_id = lo.officer_id
      JOIN societies s ON l.society_id = s.society_id;
    `);
    await sequelize.query(`
      CREATE VIEW IF NOT EXISTS overdue_loans AS
      SELECT 
          l.loan_id,
          l.loan_number,
          m.member_name,
          m.contact_number,
          rs.due_date,
          rs.total_installment,
          rs.paid_amount,
          (rs.total_installment - COALESCE(rs.paid_amount, 0)) as outstanding_amount,
          (JULIANDAY('now') - JULIANDAY(rs.due_date)) as days_overdue,
          lo.officer_name
      FROM repayment_schedule rs
      JOIN loans l ON rs.loan_id = l.loan_id
      JOIN members m ON l.member_id = m.member_id
      JOIN loan_officers lo ON l.officer_id = lo.officer_id
      WHERE rs.due_date < DATE('now') 
      AND rs.payment_status IN ('PENDING', 'PARTIAL')
      AND l.loan_status = 'ACTIVE'
      ORDER BY rs.due_date;
    `);
    await sequelize.query(`
      CREATE VIEW IF NOT EXISTS monthly_collections AS
      SELECT 
          DATE(p.payment_date, 'start of month') as collection_month,
          COUNT(DISTINCT p.loan_id) as loans_paid,
          SUM(p.principal_paid) as total_principal,
          SUM(p.interest_paid) as total_interest,
          SUM(p.savings_paid) as total_savings,
          SUM(p.penalty_paid) as total_penalties,
          SUM(p.payment_amount) as total_collection
      FROM payments p
      GROUP BY DATE(p.payment_date, 'start of month')
      ORDER BY collection_month DESC;
    `);

    // Initial Data
    const [society, createdSociety] = await sequelize.models.Society.findOrCreate({
      where: { registration_number: 'SSA001' },
      defaults: {
        society_name: 'Sri Sai Akshaya Mutually Aided Cooperative Thrift & Credit Society Ltd',
        status: 'ACTIVE'
      }
    });
    await sequelize.models.LoanProduct.findOrCreate({
      where: { product_name: 'Standard Loan', society_id: society.society_id },
      defaults: {
        interest_rate: 18.0,
        processing_fee_rate: 1.0,
        min_amount: 50000,
        max_amount: 5000000,
        min_tenure_months: 6,
        max_tenure_months: 60,
        monthly_savings_required: 200.00,
        savings_interest_rate: 6.0,
        penalty_amount: 1000.00
      }
    });
    // --- END ADVANCED SCHEMA ---
  } catch (error) {
    console.error('Database initialization error:', error);
    process.exit(1); // Exit if database initialization fails
  }
}

async function seedInitialAdminOfficer() {
  const adminExists = await LoanOfficer.findOne({ where: { role: 'admin' } });
  if (!adminExists) {
    const password = 'admin123';
    const hash = await bcrypt.hash(password, 10);
    const admin = await LoanOfficer.create({
      officer_name: 'System Admin',
      employee_id: 'ADMIN001',
      email: 'admin@bank.com',
      password: hash,
      role: 'admin',
      status: 'ACTIVE'
    });
    console.log('--- Initial Admin Officer Created ---');
    console.log('Employee ID:', admin.employee_id);
    console.log('Email:', admin.email);
    console.log('Password:', password);
    console.log('-------------------------------------');
  }
}

// Routes setup (to be added by team)
app.use('/api/members', require('./routes/memberRoutes'));
app.use('/api', exportRoutes);
app.use('/api', dashboardRoutes);
app.use('/api/loanprofiles', loanProfileRoutes);

app.use('/api/loans', outstandingInterestRoutes);
// Add more routes here as they are created

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/societies', require('./routes/societyRoutes'));
app.use('/api/loan-officers', require('./routes/loanOfficerRoutes'));
app.use('/api/loan-products', require('./routes/loanProductRoutes'));
app.use('/api/loans', require('./routes/loanRoutes'));
app.use('/api/repayment-schedules', require('./routes/repaymentScheduleRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/penalties', require('./routes/penaltyRoutes'));
app.use('/api/loan-status-history', require('./routes/loanStatusHistoryRoutes'));
app.use('/api/member-documents', require('./routes/memberDocumentRoutes'));
app.use('/api/audit-log', require('./routes/auditLogRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));


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
    await seedInitialAdminOfficer();
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
