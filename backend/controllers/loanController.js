const { Loan } = require('../models');
const IDGenerator = require('../utils/idGenerator');

exports.list = async (req, res) => {
  try {
    const loans = await Loan.findAll({
      order: [['created_at', 'DESC']]
    });
    res.json(loans);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.get = async (req, res) => {
  try {
    const loan = await Loan.findByPk(req.params.id);
    if (!loan) return res.status(404).json({ error: 'Loan not found' });
    res.json(loan);
  } catch (err) {
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
    if (err.name === 'SequelizeForeignKeyConstraintError') {
      res.status(400).json({ error: 'Cannot delete loan with existing payments' });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
}; 