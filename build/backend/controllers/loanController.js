const { Loan, RepaymentSchedule, MemberSavings, Member } = require('../models');
const IDGenerator = require('../utils/idGenerator');

exports.list = async (req, res) => {
  try {
    const loans = await Loan.findAll({
      order: [['created_at', 'DESC']]
    });
    res.json(loans);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.get = async (req, res) => {
  try {
    const loan = await Loan.findByPk(req.params.id);
    if (!loan) return res.status(404).json({ error: 'Loan not found' });
    res.json(loan);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    // Auto-generate loan number if not provided
    if (!req.body.loan_number) {
      req.body.loan_number = await IDGenerator.generateLoanId();
    }
    
    // Set default values
    req.body.society_id = req.body.society_id || 1; // Default to first society
    req.body.loan_status = req.body.loan_status || 'PENDING';
    req.body.disbursement_date = req.body.disbursement_date || new Date();
    req.body.monthly_savings = req.body.monthly_savings || 200.00;
    
    // Calculate derived fields
    const interestRate = parseFloat(req.body.interest_rate) || 12.00;
    const loanAmount = parseFloat(req.body.loan_amount) || 0;
    const tenureMonths = parseInt(req.body.tenure_months) || 12;
    
    req.body.total_interest = (loanAmount * interestRate * tenureMonths) / (12 * 100);
    req.body.total_payable = loanAmount + req.body.total_interest;
    req.body.outstanding_principal = loanAmount;
    req.body.outstanding_interest = req.body.total_interest;
    
    // Set due dates
    const disbursementDate = new Date(req.body.disbursement_date);
    req.body.first_due_date = new Date(disbursementDate.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 days later
    req.body.last_due_date = new Date(disbursementDate.getTime() + (tenureMonths * 30 * 24 * 60 * 60 * 1000));
    
    const loan = await Loan.create(req.body);
    res.status(201).json(loan);
  } catch (err) {
    console.error(err);
    if (err.name === 'SequelizeUniqueConstraintError') {
      res.status(400).json({ error: 'Loan number already exists' });
    } else {
      res.status(400).json({ error: err.message });
    }
  }
};

exports.update = async (req, res) => {
  try {
    const loan = await Loan.findByPk(req.params.id);
    if (!loan) return res.status(404).json({ error: 'Loan not found' });
    await loan.update(req.body);
    res.json(loan);
  } catch (err) {
    console.error(err);
    if (err.name === 'SequelizeUniqueConstraintError') {
      res.status(400).json({ error: 'Loan number already exists' });
    } else {
      res.status(400).json({ error: err.message });
    }
  }
};

exports.delete = async (req, res) => {
  try {
    const loan = await Loan.findByPk(req.params.id);
    if (!loan) return res.status(404).json({ error: 'Loan not found' });
    await loan.destroy();
    res.json({ message: 'Loan deleted successfully' });
  } catch (err) {
    console.error(err);
    if (err.name === 'SequelizeForeignKeyConstraintError') {
      res.status(400).json({ error: 'Cannot delete loan with existing payments' });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
};

exports.clearLoan = async (req, res) => {
  try {
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'official')) {
      return res.status(403).json({ error: 'Only officials or admins can clear loans.' });
    }
    const loan = await Loan.findByPk(req.params.id);
    if (!loan) return res.status(404).json({ error: 'Loan not found' });
    if (loan.cleared_by_official) return res.status(400).json({ error: 'Loan already cleared' });
    await loan.update({
      cleared_by_official: true,
      cleared_at: new Date(),
      loan_status: 'CLEARED'
    });
    // Savings return logic
    const schedules = await RepaymentSchedule.findAll({ where: { loan_id: loan.loan_id } });
    const totalSavings = schedules.reduce((sum, s) => sum + parseFloat(s.monthly_savings || 0), 0);
    if (totalSavings > 0) {
      await MemberSavings.create({
        member_id: loan.member_id,
        loan_id: loan.loan_id,
        transaction_type: 'RETURN',
        amount: totalSavings,
        transaction_date: new Date(),
        remarks: 'Savings returned on loan clearance',
        balance: 0 // You may want to update this with the new balance logic
      });
    }
    res.json({ message: 'Loan marked as cleared by official, savings returned', loan, totalSavings });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// Get all dues for a loan
exports.getLoanDues = async (req, res) => {
  try {
    const schedules = await RepaymentSchedule.findAll({
      where: { loan_id: req.params.id, payment_status: ['PENDING', 'PARTIAL', 'OVERDUE'] },
      order: [['installment_number', 'ASC']]
    });
    res.json(schedules);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// Get all dues for a member (across loans)
exports.getMemberDues = async (req, res) => {
  try {
    const loans = await Loan.findAll({ where: { member_id: req.params.id } });
    const loanIds = loans.map(l => l.loan_id);
    const schedules = await RepaymentSchedule.findAll({
      where: { loan_id: loanIds, payment_status: ['PENDING', 'PARTIAL', 'OVERDUE'] },
      order: [['due_date', 'ASC']]
    });
    res.json(schedules);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// Get total savings for a loan
exports.getLoanSavings = async (req, res) => {
  try {
    const schedules = await RepaymentSchedule.findAll({ where: { loan_id: req.params.id } });
    const totalSavings = schedules.reduce((sum, s) => sum + parseFloat(s.monthly_savings || 0), 0);
    res.json({ loan_id: req.params.id, totalSavings });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}; 