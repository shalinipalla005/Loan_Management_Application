const { Payment } = require('../models');
const IDGenerator = require('../utils/idGenerator');

exports.list = async (req, res) => {
  try {
    const payments = await Payment.findAll({
      order: [['created_at', 'DESC']]
    });
    res.json(payments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.get = async (req, res) => {
  try {
    const payment = await Payment.findByPk(req.params.id);
    if (!payment) return res.status(404).json({ error: 'Payment not found' });
    res.json(payment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    // Auto-generate receipt number if not provided
    if (!req.body.receipt_number) {
      req.body.receipt_number = await IDGenerator.generateReceiptNumber();
    }
    
    // Set default values
    req.body.payment_date = req.body.payment_date || new Date();
    req.body.principal_paid = req.body.principal_paid || 0.00;
    req.body.interest_paid = req.body.interest_paid || 0.00;
    req.body.savings_paid = req.body.savings_paid || 0.00;
    req.body.penalty_paid = req.body.penalty_paid || 0.00;
    req.body.payment_method = req.body.payment_method || 'CASH';
    
    // Get member_id from loan if not provided
    if (!req.body.member_id && req.body.loan_id) {
      const { Loan } = require('../models');
      const loan = await Loan.findByPk(req.body.loan_id);
      if (loan) {
        req.body.member_id = loan.member_id;
      }
    }
    
    const payment = await Payment.create(req.body);
    res.status(201).json(payment);
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      res.status(400).json({ error: 'Receipt number already exists' });
    } else {
      res.status(400).json({ error: err.message });
    }
  }
};

exports.update = async (req, res) => {
  try {
    const payment = await Payment.findByPk(req.params.id);
    if (!payment) return res.status(404).json({ error: 'Payment not found' });
    await payment.update(req.body);
    res.json(payment);
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      res.status(400).json({ error: 'Receipt number already exists' });
    } else {
      res.status(400).json({ error: err.message });
    }
  }
};

exports.delete = async (req, res) => {
  try {
    const payment = await Payment.findByPk(req.params.id);
    if (!payment) return res.status(404).json({ error: 'Payment not found' });
    await payment.destroy();
    res.json({ message: 'Payment deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}; 