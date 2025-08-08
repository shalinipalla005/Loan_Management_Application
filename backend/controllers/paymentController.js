const { Payment, Loan, RepaymentSchedule } = require('../models');
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
    req.body.payment_date = req.body.payment_date || new Date();
    req.body.principal_paid = req.body.principal_paid || 0.00;
    req.body.interest_paid = req.body.interest_paid || 0.00;
    req.body.savings_paid = req.body.savings_paid || 0.00;
    req.body.penalty_paid = req.body.penalty_paid || 0.00;
    req.body.payment_method = req.body.payment_method || 'CASH';

    // Get member_id from loan if not provided
    if (!req.body.member_id && req.body.loan_id) {
      const loan = await Loan.findByPk(req.body.loan_id);
      if (loan) {
        req.body.member_id = loan.member_id;
      }
    }

    // --- Payment Allocation Logic ---
    const loan = await Loan.findByPk(req.body.loan_id);
    if (!loan) throw new Error('Loan not found');
    let remaining = parseFloat(req.body.payment_amount);
    let penaltyPaid = 0, interestPaid = 0, principalPaid = 0, savingsPaid = 0;

    // Find the next due schedule
    const schedule = await RepaymentSchedule.findOne({
      where: { loan_id: loan.loan_id, payment_status: ['PENDING', 'OVERDUE', 'PARTIAL'] },
      order: [['installment_number', 'ASC']]
    });
    if (!schedule) throw new Error('No due schedule found');

    // 1. Penalty
    if (schedule.penalty_applied > 0 && remaining > 0) {
      penaltyPaid = Math.min(remaining, parseFloat(schedule.penalty_applied));
      remaining -= penaltyPaid;
    }
    // 2. Interest
    if (schedule.interest_amount > 0 && remaining > 0) {
      interestPaid = Math.min(remaining, parseFloat(schedule.interest_amount));
      remaining -= interestPaid;
    }
    // 3. Principal
    if (schedule.principal_amount > 0 && remaining > 0) {
      principalPaid = Math.min(remaining, parseFloat(schedule.principal_amount));
      remaining -= principalPaid;
    }
    // 4. Savings
    if (schedule.monthly_savings > 0 && remaining > 0) {
      savingsPaid = Math.min(remaining, parseFloat(schedule.monthly_savings));
      remaining -= savingsPaid;
    }

    // Update schedule
    const totalPaid = penaltyPaid + interestPaid + principalPaid + savingsPaid;
    let newStatus = 'PAID';
    if (totalPaid < (parseFloat(schedule.total_installment) + parseFloat(schedule.penalty_applied))) {
      newStatus = 'PARTIAL';
    }
    await schedule.update({
      paid_amount: (parseFloat(schedule.paid_amount) + totalPaid).toFixed(2),
      paid_date: req.body.payment_date,
      payment_status: newStatus
    });

    // Update loan outstanding
    let newOutstandingPrincipal = parseFloat(loan.outstanding_principal) - principalPaid;
    let newOutstandingInterest = parseFloat(loan.outstanding_interest) - interestPaid;
    let newStatusLoan = loan.loan_status;
    if (newOutstandingPrincipal <= 0 && newOutstandingInterest <= 0) {
      newStatusLoan = 'CLOSED';
    } else if (loan.loan_status === 'PENDING') {
      newStatusLoan = 'ACTIVE';
    }
    await loan.update({
      outstanding_principal: newOutstandingPrincipal.toFixed(2),
      outstanding_interest: newOutstandingInterest.toFixed(2),
      loan_status: newStatusLoan
    });

    // Save payment record
    req.body.principal_paid = principalPaid;
    req.body.interest_paid = interestPaid;
    req.body.savings_paid = savingsPaid;
    req.body.penalty_paid = penaltyPaid;
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