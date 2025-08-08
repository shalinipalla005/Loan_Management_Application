const Loan = require('../models/Loan');
const Member = require('../models/Member');
const RepaymentSchedule = require('../models/RepaymentSchedule');
const { generateLoanSchedule } = require('../utils/helpers');
const Payment = require('../models/Payment');
const Penalty = require('../models/Penalty');
const MemberSavings = require('../models/MemberSavings');

// GET /api/loans - List all loan profiles with member details
exports.getAllLoans = async (req, res) => {
  try {
    const loans = await Loan.findAll({
      include: [{
        model: Member,
        as: 'member',
        attributes: ['member_id', 'member_name', 'membership_number', 'contact_number', 'email']
      }],
      order: [['created_at', 'DESC']]
    });

    res.status(200).json({
      success: true,
      count: loans.length,
      data: loans
    });
  } catch (error) {
    console.error('Error fetching loans:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching loans',
      error: error.message
    });
  }
};

// GET /api/loans/members - Fetch all members with their associated loans
exports.getMembersWithLoans = async (req, res) => {
  try {
    const { status, society_id } = req.query;
    
    const whereClause = {};
    if (status) whereClause.status = status;
    if (society_id) whereClause.society_id = society_id;

    const loanWhereClause = {};
    if (req.query.loan_status) loanWhereClause.loan_status = req.query.loan_status;

    const members = await Member.findAll({
      where: whereClause,
      include: [{
        model: Loan,
        as: 'loans',
        where: loanWhereClause,
        required: false, // LEFT JOIN to include members even without loans
        order: [['created_at', 'DESC']]
      }],
      order: [['member_name', 'ASC']]
    });

    // Calculate summary for each member
    const membersWithSummary = members.map(member => {
      const memberData = member.toJSON();
      const loans = memberData.loans || [];
      
      const summary = {
        total_loans: loans.length,
        active_loans: loans.filter(loan => loan.loan_status === 'ACTIVE').length,
        pending_loans: loans.filter(loan => loan.loan_status === 'PENDING').length,
        closed_loans: loans.filter(loan => loan.loan_status === 'CLOSED').length,
        total_outstanding_principal: loans.reduce((sum, loan) => sum + parseFloat(loan.outstanding_principal || 0), 0),
        total_outstanding_interest: loans.reduce((sum, loan) => sum + parseFloat(loan.outstanding_interest || 0), 0),
        total_loan_amount: loans.reduce((sum, loan) => sum + parseFloat(loan.loan_amount || 0), 0)
      };

      return {
        ...memberData,
        loan_summary: summary
      };
    });

    res.status(200).json({
      success: true,
      count: membersWithSummary.length,
      data: membersWithSummary
    });
  } catch (error) {
    console.error('Error fetching members with loans:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching members with loans',
      error: error.message
    });
  }
};

// GET /api/loans/members/:memberId - Fetch specific member with their loans
exports.getMemberWithLoans = async (req, res) => {
  try {
    const { memberId } = req.params;
    const { loan_status } = req.query;

    const loanWhereClause = {};
    if (loan_status) loanWhereClause.loan_status = loan_status;

    const member = await Member.findByPk(memberId, {
      include: [{
        model: Loan,
        as: 'loans',
        where: loanWhereClause,
        required: false,
        order: [['created_at', 'DESC']],
        include: [
          require('../models/RepaymentSchedule'),
          require('../models/Payment'),
          require('../models/Penalty'),
          require('../models/MemberSavings')
        ]
      }]
    });

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found'
      });
    }

    const memberData = member.toJSON();
    const loans = memberData.loans || [];
    
    // Calculate detailed summary
    const summary = {
      total_loans: loans.length,
      active_loans: loans.filter(loan => loan.loan_status === 'ACTIVE').length,
      pending_loans: loans.filter(loan => loan.loan_status === 'PENDING').length,
      closed_loans: loans.filter(loan => loan.loan_status === 'CLOSED').length,
      total_outstanding_principal: loans.reduce((sum, loan) => sum + parseFloat(loan.outstanding_principal || 0), 0),
      total_outstanding_interest: loans.reduce((sum, loan) => sum + parseFloat(loan.outstanding_interest || 0), 0),
      total_loan_amount: loans.reduce((sum, loan) => sum + parseFloat(loan.loan_amount || 0), 0),
      total_amount_paid: loans.reduce((sum, loan) => {
        const loanAmount = parseFloat(loan.loan_amount || 0);
        const totalInterest = parseFloat(loan.total_interest || 0);
        const outstandingPrincipal = parseFloat(loan.outstanding_principal || 0);
        const outstandingInterest = parseFloat(loan.outstanding_interest || 0);
        return sum + (loanAmount + totalInterest - outstandingPrincipal - outstandingInterest);
      }, 0)
    };

    res.status(200).json({
      success: true,
      data: {
        ...memberData,
        loan_summary: summary
      }
    });
  } catch (error) {
    console.error('Error fetching member with loans:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching member with loans',
      error: error.message
    });
  }
};

// POST /api/loans - Add a new loan
exports.createLoan = async (req, res) => {
  try {
    const {
      loan_number,
      member_id,
      society_id,
      officer_id,
      product_id,
      loan_amount,
      interest_rate,
      tenure_months,
      processing_fee,
      monthly_savings,
      disbursement_date,
      first_due_date
    } = req.body;

    // Calculate loan details
    const total_interest = (loan_amount * interest_rate * tenure_months) / (12 * 100);
    const total_payable = parseFloat(loan_amount) + parseFloat(total_interest);
    const last_due_date = new Date(first_due_date);
    last_due_date.setMonth(last_due_date.getMonth() + tenure_months - 1);

    const newLoan = await Loan.create({
      loan_number,
      member_id,
      society_id,
      officer_id,
      product_id,
      loan_amount,
      interest_rate,
      tenure_months,
      processing_fee,
      monthly_savings: monthly_savings || 200.00,
      disbursement_date,
      first_due_date,
      last_due_date,
      total_interest,
      total_payable,
      outstanding_principal: loan_amount,
      outstanding_interest: total_interest,
      loan_status: 'PENDING'
    });

    // Generate and insert repayment schedule
    const schedule = generateLoanSchedule({
      loan_amount,
      interest_rate,
      tenure_months,
      monthly_savings: monthly_savings || 200.00,
      first_due_date,
      disbursement_date
    });
    const scheduleRows = schedule.map((item, idx) => ({
      loan_id: newLoan.loan_id,
      installment_number: idx + 1,
      due_date: item['Due Date'],
      opening_balance: (parseFloat(loan_amount) - (parseFloat(item['Principal']) * idx)).toFixed(2),
      principal_amount: item['Principal'],
      interest_amount: item['Interest'],
      monthly_savings: item['Savings'],
      total_installment: item['Total Amount'],
      closing_balance: item['Remaining Principal'],
      payment_status: item['Status'],
      paid_date: null,
      paid_amount: 0.00,
      penalty_applied: 0.00
    }));
    await RepaymentSchedule.bulkCreate(scheduleRows);

    // Fetch the created loan with member details
    const loanWithMember = await Loan.findByPk(newLoan.loan_id, {
      include: [{
        model: Member,
        as: 'member',
        attributes: ['member_id', 'member_name', 'membership_number', 'contact_number', 'email']
      }]
    });

    res.status(201).json({
      success: true,
      message: 'Loan created successfully',
      data: loanWithMember
    });
  } catch (error) {
    console.error('Error creating loan:', error);
    res.status(400).json({
      success: false,
      message: 'Error creating loan',
      error: error.message
    });
  }
};

// GET /api/loans/:loanId - Get a specific loan profile
exports.getLoanById = async (req, res) => {
  try {
    const { loanId } = req.params;

    const loan = await Loan.findByPk(loanId, {
      include: [
        {
          model: Member,
          as: 'member',
          attributes: ['member_id', 'member_name', 'membership_number', 'contact_number', 'email', 'address']
        },
        require('../models/RepaymentSchedule'),
        Payment,
        Penalty,
        MemberSavings
      ]
    });

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Loan not found'
      });
    }

    res.status(200).json({
      success: true,
      data: loan
    });
  } catch (error) {
    console.error('Error fetching loan:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching loan',
      error: error.message
    });
  }
};

// PUT /api/loans/:loanId - Update a loan profile (for payments and all)
exports.updateLoan = async (req, res) => {
  try {
    const { loanId } = req.params;
    const updateData = req.body;

    const loan = await Loan.findByPk(loanId);
    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Loan not found'
      });
    }

    // If payment is being made, update outstanding amounts
    if (updateData.payment_amount) {
      const paymentAmount = parseFloat(updateData.payment_amount);
      
      // First pay off interest, then principal
      let remainingPayment = paymentAmount;
      let newOutstandingInterest = parseFloat(loan.outstanding_interest);
      let newOutstandingPrincipal = parseFloat(loan.outstanding_principal);

      if (remainingPayment > 0 && newOutstandingInterest > 0) {
        const interestPayment = Math.min(remainingPayment, newOutstandingInterest);
        newOutstandingInterest -= interestPayment;
        remainingPayment -= interestPayment;
      }

      if (remainingPayment > 0 && newOutstandingPrincipal > 0) {
        const principalPayment = Math.min(remainingPayment, newOutstandingPrincipal);
        newOutstandingPrincipal -= principalPayment;
      }

      updateData.outstanding_interest = newOutstandingInterest;
      updateData.outstanding_principal = newOutstandingPrincipal;

      // Update loan status if fully paid
      if (newOutstandingInterest === 0 && newOutstandingPrincipal === 0) {
        updateData.loan_status = 'CLOSED';
      } else if (loan.loan_status === 'PENDING') {
        updateData.loan_status = 'ACTIVE';
      }

      // Remove payment_amount from updateData as it's not a field in the model
      delete updateData.payment_amount;
    }

    // Update the loan
    await loan.update({
      ...updateData,
      updated_at: new Date()
    });

    // Fetch updated loan with member details
    const updatedLoan = await Loan.findByPk(loanId, {
      include: [{
        model: Member,
        as: 'member',
        attributes: ['member_id', 'member_name', 'membership_number', 'contact_number', 'email']
      }]
    });

    res.status(200).json({
      success: true,
      message: 'Loan updated successfully',
      data: updatedLoan
    });
  } catch (error) {
    console.error('Error updating loan:', error);
    res.status(400).json({
      success: false,
      message: 'Error updating loan',
      error: error.message
    });
  }
};

// DELETE /api/loans/:loanId - Delete a loan profile
exports.deleteLoan = async (req, res) => {
  try {
    const { loanId } = req.params;

    const loan = await Loan.findByPk(loanId);
    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Loan not found'
      });
    }

    // Check if loan can be deleted (e.g., only pending loans)
    if (loan.loan_status === 'ACTIVE' && (loan.outstanding_principal > 0 || loan.outstanding_interest > 0)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete loan with outstanding balance'
      });
    }

    await loan.destroy();

    res.status(200).json({
      success: true,
      message: 'Loan deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting loan:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting loan',
      error: error.message
    });
  }
};