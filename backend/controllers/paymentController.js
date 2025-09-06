const { Payment, Loan, RepaymentSchedule } = require('../models');
const { Op } = require('sequelize');
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
    if (!loan) {
      return res.status(404).json({ error: 'Loan not found' });
    }

    // Verify loan status
    if (loan.loan_status !== 'ACTIVE' && loan.loan_status !== 'DISBURSED' && loan.loan_status !== 'APPROVED') {
      return res.status(400).json({ 
        error: `Cannot process payment. Loan status is ${loan.loan_status}. Loan must be ACTIVE, APPROVED or DISBURSED.` 
      });
    }

    console.log('Processing payment for loan:', {
      loan_id: loan.loan_id,
      loan_status: loan.loan_status,
      amount: loan.loan_amount
    });

    // Use the amounts provided in the request body (from frontend form)
    let penaltyPaid = parseFloat(req.body.penalty_paid || 0);
    let interestPaid = parseFloat(req.body.interest_paid || 0);
    let principalPaid = parseFloat(req.body.principal_paid || 0);
    let savingsPaid = parseFloat(req.body.savings_paid || 0);
    const totalPaid = parseFloat(req.body.payment_amount);

    // Validate that the sum of individual amounts equals the total payment amount
    const calculatedTotal = penaltyPaid + interestPaid + principalPaid + savingsPaid;
    if (Math.abs(calculatedTotal - totalPaid) > 0.01) {
      return res.status(400).json({ 
        error: `Payment breakdown doesn't match total amount. Total: ₹${totalPaid}, Breakdown: ₹${calculatedTotal}` 
      });
    }

    // Find the first unpaid or partially paid installment
    const allSchedules = await RepaymentSchedule.findAll({
      where: {
        loan_id: loan.loan_id
      },
      order: [['installment_number', 'ASC']]
    });

    console.log('Found schedules:', allSchedules.length, 'for loan:', loan.loan_id);

    if (!allSchedules || allSchedules.length === 0) {
      return res.status(400).json({ 
        error: "No installments found for this loan. Please ensure repayment schedules are generated.",
        loanId: loan.loan_id 
      });
    }

    // Find the first unpaid or partially paid installment
    const schedule = allSchedules.find(sch => {
      const totalAmount = parseFloat(sch.total_installment);
      const paidAmount = parseFloat(sch.paid_amount || 0);
      return paidAmount < totalAmount;
    });

    if (!schedule) {
      return res.status(400).json({ error: "All installments for this loan are fully paid." });
    }

    // Check if this installment is already fully paid
    const totalInstallment = parseFloat(schedule.total_installment);
    const alreadyPaid = parseFloat(schedule.paid_amount || 0);
    
    if (alreadyPaid >= totalInstallment) {
      return res.status(400).json({ error: "This installment is already fully paid. Please proceed to the next installment." });
    }

    // Validate payment amounts against schedule requirements
    const remainingPenalty = Math.max(0, parseFloat(schedule.penalty_applied || 0) - parseFloat(schedule.paid_amount || 0));
    const remainingInterest = Math.max(0, parseFloat(schedule.interest_amount || 0) - parseFloat(schedule.paid_amount || 0));
    const remainingPrincipal = Math.max(0, parseFloat(schedule.principal_amount || 0) - parseFloat(schedule.paid_amount || 0));
    const remainingSavings = Math.max(0, parseFloat(schedule.monthly_savings || 0) - parseFloat(schedule.paid_amount || 0));

    // Warn if payment exceeds what's due for this installment
    if (penaltyPaid > remainingPenalty || interestPaid > remainingInterest || 
        principalPaid > remainingPrincipal || savingsPaid > remainingSavings) {
      console.warn('Payment amounts exceed remaining amounts for this installment');
    }

    // Update schedule with the payment
    const updatedPaidAmount = (parseFloat(schedule.paid_amount || 0) + totalPaid).toFixed(2);
    const totalRequired = parseFloat(schedule.total_installment);
    
    let newStatus;
    if (parseFloat(updatedPaidAmount) >= totalRequired) {
      newStatus = 'PAID';
    } else if (parseFloat(updatedPaidAmount) > 0) {
      newStatus = 'PARTIAL';
    } else {
      newStatus = 'PENDING';
    }

    await schedule.update({
      paid_amount: updatedPaidAmount,
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
    req.body.schedule_id = schedule.schedule_id;
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