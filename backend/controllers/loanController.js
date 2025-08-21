const { Loan, RepaymentSchedule, MemberSavings, Member } = require('../models');
const IDGenerator = require('../utils/idGenerator');

exports.list = async (req, res) => {
  try {
    const where = {};
    // If a client is logged in, restrict to their society
    if (req.officer && req.officer.role === 'client' && req.officer.society_id) {
      where.society_id = req.officer.society_id;
    }
    const loans = await Loan.findAll({
      where,
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
    if (req.officer && req.officer.role === 'client' && req.officer.society_id && loan.society_id !== req.officer.society_id) {
      return res.status(403).json({ error: 'Access denied' });
    }
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
    
    // Resolve society_id from member to ensure consistency
    if (!req.body.member_id) {
      return res.status(400).json({ error: 'member_id is required' });
    }
    const member = await Member.findByPk(req.body.member_id);
    if (!member) {
      return res.status(400).json({ error: 'Invalid member_id' });
    }
    req.body.society_id = member.society_id;
    req.body.loan_status = 'ACTIVE'; // Ensure loan status is set to ACTIVE
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
    
    // Generate repayment schedules for the new loan
    const { generateLoanSchedule } = require('../utils/helpers');
    
    // Check if repayment schedules already exist
    const existingSchedules = await RepaymentSchedule.findAll({
      where: { loan_id: loan.loan_id }
    });
    
    if (existingSchedules.length === 0) {
      const schedule = generateLoanSchedule({
        loan_amount: loan.loan_amount,
        interest_rate: loan.interest_rate,
        tenure_months: loan.tenure_months,
        monthly_savings: loan.monthly_savings,
        first_due_date: loan.first_due_date,
        disbursement_date: loan.disbursement_date
      });
      
      if (schedule.length > 0) {
        const scheduleRows = schedule.map((item, idx) => ({
          loan_id: loan.loan_id,
          installment_number: idx + 1,
          due_date: item['Due Date'],
          opening_balance: (parseFloat(loan.loan_amount) - (parseFloat(item['Principal']) * idx)).toFixed(2),
          principal_amount: item['Principal'],
          interest_amount: item['Interest'],
          monthly_savings: item['Savings'],
          total_installment: item['Total Amount'],
          closing_balance: item['Remaining Principal'],
          payment_status: 'PENDING',
          paid_date: null,
          paid_amount: 0.00,
          penalty_applied: 0.00
        }));
        
        await RepaymentSchedule.bulkCreate(scheduleRows);
        console.log(`Generated ${scheduleRows.length} repayment schedules for loan ${loan.loan_id}`);
      } else {
        console.error(`Failed to generate repayment schedules for loan ${loan.loan_id}. Check loan parameters.`);
      }
    } else {
      console.log(`Repayment schedules already exist for loan ${loan.loan_id}. Skipping generation.`);
    }
    
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
    // If member_id is being changed, align society_id with the new member
    if (req.body.member_id && req.body.member_id !== loan.member_id) {
      const newMember = await Member.findByPk(req.body.member_id);
      if (!newMember) {
        return res.status(400).json({ error: 'Invalid member_id' });
      }
      req.body.society_id = newMember.society_id;
    }
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
    const actor = req.officer;
    if (!actor || (actor.role !== 'admin' && actor.role !== 'officer')) {
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

// Handle loan approval by admin
exports.approveLoan = async (req, res) => {
  try {
    const loan = await Loan.findByPk(req.params.id);
    if (!loan) {
      return res.status(404).json({ error: 'Loan not found' });
    }

    if (loan.loan_status !== 'PENDING') {
      return res.status(400).json({ error: 'Loan is not in PENDING status' });
    }

    // Update loan status to APPROVED
    await loan.update({
      loan_status: 'APPROVED',
      updated_at: new Date()
    });

    // Check if repayment schedules exist
    const schedules = await RepaymentSchedule.findAll({
      where: { loan_id: loan.loan_id }
    });

    if (schedules.length > 0) {
      // Update existing schedules
      for (let schedule of schedules) {
        await schedule.update({
          payment_status: 'PENDING'
        });
      }
      console.log(`Updated ${schedules.length} existing repayment schedules for loan ${loan.loan_id}`);
    } else {
      // Generate repayment schedules if they don't exist
      const { generateLoanSchedule } = require('../utils/helpers');
      
      // Ensure we have a disbursement date
      const disbursementDate = loan.disbursement_date || new Date();
      
      // Calculate first due date if not set
      let firstDueDate = loan.first_due_date;
      if (!firstDueDate) {
        firstDueDate = new Date(disbursementDate);
        firstDueDate.setDate(firstDueDate.getDate() + 30); // 30 days after disbursement
        
        // Update loan with the calculated first due date
        await loan.update({
          first_due_date: firstDueDate
        });
      }
      
      const schedule = generateLoanSchedule({
        loan_amount: loan.loan_amount,
        interest_rate: loan.interest_rate,
        tenure_months: loan.tenure_months,
        monthly_savings: loan.monthly_savings || 200.00,
        first_due_date: firstDueDate,
        disbursement_date: disbursementDate
      });
      
      if (schedule.length > 0) {
        const scheduleRows = schedule.map((item, idx) => ({
          loan_id: loan.loan_id,
          installment_number: idx + 1,
          due_date: item['Due Date'],
          opening_balance: (parseFloat(loan.loan_amount) - (parseFloat(item['Principal']) * idx)).toFixed(2),
          principal_amount: item['Principal'],
          interest_amount: item['Interest'],
          monthly_savings: item['Savings'],
          total_installment: item['Total Amount'],
          closing_balance: item['Remaining Principal'],
          payment_status: 'PENDING',
          paid_date: null,
          paid_amount: 0.00,
          penalty_applied: 0.00
        }));
        
        await RepaymentSchedule.bulkCreate(scheduleRows);
        console.log(`Generated ${scheduleRows.length} repayment schedules for loan ${loan.loan_id}`);
      } else {
        console.error(`Failed to generate repayment schedules for loan ${loan.loan_id}. Check loan parameters.`);
      }
    }

    res.json({
      message: 'Loan successfully approved',
      loan: loan
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// Handle loan disbursement
exports.disburseLoan = async (req, res) => {
  try {
    const loan = await Loan.findByPk(req.params.id);
    if (!loan) {
      return res.status(404).json({ error: 'Loan not found' });
    }

    if (loan.loan_status !== 'PENDING' && loan.loan_status !== 'APPROVED') {
      return res.status(400).json({ error: 'Loan must be in PENDING or APPROVED status' });
    }

    const disbursementDate = req.body.disbursement_date || new Date();
    
    // Update loan status to DISBURSED
    await loan.update({
      loan_status: 'DISBURSED',
      disbursement_date: disbursementDate,
      disbursed_by: req.officer ? req.officer.loan_officer_id : null
    });

    // Check if repayment schedules exist
    const schedules = await RepaymentSchedule.findAll({
      where: { loan_id: loan.loan_id }
    });

    if (schedules.length > 0) {
      // Update existing schedules
      for (let schedule of schedules) {
        await schedule.update({
          payment_status: 'PENDING'
        });
      }
      console.log(`Updated ${schedules.length} existing repayment schedules for loan ${loan.loan_id}`);
    } else {
      // Generate repayment schedules if they don't exist
      const { generateLoanSchedule } = require('../utils/helpers');
      
      // Calculate first due date if not set
      let firstDueDate = loan.first_due_date;
      if (!firstDueDate) {
        firstDueDate = new Date(disbursementDate);
        firstDueDate.setDate(firstDueDate.getDate() + 30); // 30 days after disbursement
      }
      
      const schedule = generateLoanSchedule({
        loan_amount: loan.loan_amount,
        interest_rate: loan.interest_rate,
        tenure_months: loan.tenure_months,
        monthly_savings: loan.monthly_savings || 200.00,
        first_due_date: firstDueDate,
        disbursement_date: disbursementDate
      });
      
      if (schedule.length > 0) {
        const scheduleRows = schedule.map((item, idx) => ({
          loan_id: loan.loan_id,
          installment_number: idx + 1,
          due_date: item['Due Date'],
          opening_balance: (parseFloat(loan.loan_amount) - (parseFloat(item['Principal']) * idx)).toFixed(2),
          principal_amount: item['Principal'],
          interest_amount: item['Interest'],
          monthly_savings: item['Savings'],
          total_installment: item['Total Amount'],
          closing_balance: item['Remaining Principal'],
          payment_status: 'PENDING',
          paid_date: null,
          paid_amount: 0.00,
          penalty_applied: 0.00
        }));
        
        await RepaymentSchedule.bulkCreate(scheduleRows);
        console.log(`Generated ${scheduleRows.length} repayment schedules for loan ${loan.loan_id}`);
        
        // Update loan with calculated first and last due dates if they weren't set
        if (!loan.first_due_date || !loan.last_due_date) {
          const lastDueDate = new Date(firstDueDate);
          lastDueDate.setMonth(lastDueDate.getMonth() + loan.tenure_months - 1);
          
          await loan.update({
            first_due_date: firstDueDate,
            last_due_date: lastDueDate
          });
        }
      } else {
        console.error(`Failed to generate repayment schedules for loan ${loan.loan_id}. Check loan parameters.`);
      }
    }

    res.json({
      message: 'Loan successfully disbursed',
      loan: loan
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};