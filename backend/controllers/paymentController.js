const { Payment, Loan, RepaymentSchedule } = require('../models');
const { Op } = require('sequelize');
const IDGenerator = require('../utils/idGenerator');
const { redistributeRemainingAmounts } = require('../utils/helpers');



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

    // Debug logging
    console.log('Payment amounts from frontend:', {
      principalPaid,
      interestPaid,
      savingsPaid,
      penaltyPaid,
      totalPaid,
      outstandingPrincipal: loan.outstanding_principal,
      outstandingInterest: loan.outstanding_interest
    });

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

    // Allow user to pay any amount they want - no strict validation against schedule
    // The user has flexibility to pay whatever amount they want against the loan
    console.log('Processing payment with user-specified amounts:', {
      principalPaid,
      interestPaid,
      savingsPaid,
      penaltyPaid,
      totalPaid
    });

    // Note: Schedule update is handled by database trigger
    // The trigger will update paid_amount, payment_status, and paid_date
    // No need to update schedule here to avoid double processing

    // Note: Loan outstanding amounts are updated by database trigger
    // No need to update loan here to avoid double deduction

    // Save payment record with correct amounts
    const paymentData = {
      ...req.body,
      schedule_id: schedule ? schedule.schedule_id : null, // Make schedule_id nullable
      principal_paid: principalPaid,
      interest_paid: interestPaid,
      savings_paid: savingsPaid,
      penalty_paid: penaltyPaid
    };

    console.log('Creating payment with data:', paymentData);
    const payment = await Payment.create(paymentData);
    console.log('Payment created successfully:', payment.payment_id);
    
    // Now trigger redistribution after payment is created
    await redistributeScheduleAfterPayment(loan.loan_id);
    
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
    
    // Note: Payment updates should also update loan outstanding amounts
    // This is a simplified update - in production, you might want to recalculate
    // the loan outstanding amounts when a payment is updated
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
    
    // Note: Payment deletion should also update loan outstanding amounts
    // This is a simplified delete - in production, you might want to recalculate
    // the loan outstanding amounts when a payment is deleted
    await payment.destroy();
    res.json({ message: 'Payment deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Function to redistribute remaining amounts after payment
async function redistributeScheduleAfterPayment(loanId) {
  try {
    console.log('Starting schedule redistribution for loan:', loanId);
    
    // Get the updated loan details (outstanding amounts should be updated by now)
    const loan = await Loan.findByPk(loanId);
    if (!loan) {
      console.error('Loan not found for redistribution:', loanId);
      return;
    }

    // Get all schedules to find paid and pending ones
    const allSchedules = await RepaymentSchedule.findAll({
      where: {
        loan_id: loanId
      },
      order: [['installment_number', 'ASC']]
    });

    // Separate paid and pending schedules
    const paidSchedules = allSchedules.filter(sch => sch.payment_status === 'PAID');
    const pendingSchedules = allSchedules.filter(sch => 
      sch.payment_status === 'PENDING' || sch.payment_status === 'PARTIAL'
    );

    if (pendingSchedules.length === 0) {
      console.log('No pending schedules to redistribute for loan:', loanId);
      return;
    }

    // Use the updated outstanding amounts from the loan (already updated in payment processing)
    const remainingPrincipal = parseFloat(loan.outstanding_principal);
    const remainingInterest = parseFloat(loan.outstanding_interest);
    const remainingMonths = pendingSchedules.length;
    const monthlySavings = parseFloat(loan.monthly_savings || 0);

    console.log('=== REDISTRIBUTION PROCESSING ===');
    console.log('Redistribution parameters:', {
      loanId,
      remainingPrincipal,
      remainingInterest,
      remainingMonths,
      monthlySavings,
      paidSchedules: paidSchedules.length,
      pendingSchedules: pendingSchedules.length
    });

    // Get the next due date (from the first pending schedule)
    const nextDueDate = pendingSchedules[0].due_date;

    // Generate new schedule with redistributed amounts
    const newSchedule = redistributeRemainingAmounts(
      loanId,
      remainingPrincipal,
      remainingInterest,
      remainingMonths,
      monthlySavings,
      nextDueDate
    );

    console.log('Generated new schedule:', newSchedule);
    console.log('=== END REDISTRIBUTION PROCESSING ===');

    // Delete only pending/partial schedules (keep paid ones)
    await RepaymentSchedule.destroy({
      where: {
        loan_id: loanId,
        payment_status: ['PENDING', 'PARTIAL']
      }
    });

    // Create new schedules starting from the next installment number after paid ones
    const nextInstallmentNumber = paidSchedules.length > 0 ? 
      Math.max(...paidSchedules.map(sch => sch.installment_number)) + 1 : 
      pendingSchedules[0].installment_number;

    // Calculate opening balance for the first new installment
    let currentOpeningBalance = remainingPrincipal;

    const scheduleRows = newSchedule.map((item, idx) => {
      const principalAmount = parseFloat(item['Principal']);
      const interestAmount = parseFloat(item['Interest']);
      const totalAmount = principalAmount + interestAmount + monthlySavings;
      
      const scheduleRow = {
        loan_id: loanId,
        installment_number: nextInstallmentNumber + idx,
        due_date: item['Due Date'],
        opening_balance: currentOpeningBalance.toFixed(2),
        principal_amount: principalAmount.toFixed(2),
        interest_amount: interestAmount.toFixed(2),
        monthly_savings: monthlySavings.toFixed(2),
        total_installment: totalAmount.toFixed(2),
        closing_balance: (currentOpeningBalance - principalAmount).toFixed(2),
        payment_status: 'PENDING',
        paid_date: null,
        paid_amount: 0.00,
        penalty_applied: 0.00
      };
      
      // Update opening balance for next iteration
      currentOpeningBalance -= principalAmount;
      
      return scheduleRow;
    });

    await RepaymentSchedule.bulkCreate(scheduleRows);
    console.log(`Redistributed ${scheduleRows.length} schedules for loan ${loanId} starting from installment ${nextInstallmentNumber}`);

    // Update any payments that don't have a valid schedule_id
    const orphanedPayments = await Payment.findAll({
      where: {
        loan_id: loanId,
        schedule_id: null
      }
    });

    if (orphanedPayments.length > 0) {
      console.log(`Found ${orphanedPayments.length} orphaned payments, updating schedule references...`);
      
      // Get the first installment for each orphaned payment
      const firstInstallment = await RepaymentSchedule.findOne({
        where: {
          loan_id: loanId,
          installment_number: 1
        }
      });

      if (firstInstallment) {
        await Payment.update(
          { schedule_id: firstInstallment.schedule_id },
          {
            where: {
              loan_id: loanId,
              schedule_id: null
            }
          }
        );
        console.log(`Updated ${orphanedPayments.length} payments with schedule_id: ${firstInstallment.schedule_id}`);
      }
    }

  } catch (error) {
    console.error('Error redistributing schedule:', error);
  }
}