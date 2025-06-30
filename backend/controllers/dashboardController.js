const { Loan, Member, Society, LoanProduct } = require('../models');

class DashboardController {
  // GET /api/dashboard/interest - Dashboard view of all borrowers' upcoming/pending interest
  static async getInterestDashboard(req, res) {
    try {
      const { society_id, status, overdue_only } = req.query;
      
      const whereClause = {};
      if (society_id) whereClause.society_id = society_id;
      if (status) whereClause.loan_status = status;

      const loans = await Loan.findAll({
        where: whereClause,
        include: [
          {
            model: Member,
            attributes: ['member_name', 'membership_number', 'contact_number']
          },
          {
            model: Society,
            attributes: ['society_name']
          },
          {
            model: LoanProduct,
            attributes: ['product_name']
          }
        ],
        order: [['first_due_date', 'ASC']]
      });

      const currentDate = new Date();
      const dashboardData = [];

      for (const loan of loans) {
        if (!loan.disbursement_date || !loan.first_due_date) continue;

        const schedule = generateLoanSchedule(loan);
        const upcomingPayments = [];
        const overduePayments = [];

        schedule.forEach(payment => {
          const dueDate = new Date(payment['Due Date']);
          const daysDiff = Math.ceil((dueDate - currentDate) / (1000 * 60 * 60 * 24));

          if (payment.Status === 'PENDING' || payment.Status === 'PARTIAL') {
            if (daysDiff < 0) {
              overduePayments.push({
                ...payment,
                days_overdue: Math.abs(daysDiff)
              });
            } else if (daysDiff <= 30) {
              upcomingPayments.push({
                ...payment,
                days_until_due: daysDiff
              });
            }
          }
        });

        // Skip if filtering for overdue only and no overdue payments
        if (overdue_only === 'true' && overduePayments.length === 0) continue;

        const totalOutstanding = parseFloat(loan.outstanding_principal || 0) + parseFloat(loan.outstanding_interest || 0);

        dashboardData.push({
          loan_id: loan.loan_id,
          loan_number: loan.loan_number,
          member_name: loan.Member?.member_name || '',
          membership_number: loan.Member?.membership_number || '',
          contact_number: loan.Member?.contact_number || '',
          society_name: loan.Society?.society_name || '',
          product_name: loan.LoanProduct?.product_name || '',
          loan_amount: parseFloat(loan.loan_amount || 0),
          outstanding_principal: parseFloat(loan.outstanding_principal || 0),
          outstanding_interest: parseFloat(loan.outstanding_interest || 0),
          total_outstanding: totalOutstanding,
          loan_status: loan.loan_status,
          upcoming_payments: upcomingPayments,
          overdue_payments: overduePayments,
          total_overdue_amount: overduePayments.reduce((sum, p) => sum + parseFloat(p['Total Amount'] || 0), 0),
          next_due_date: upcomingPayments.length > 0 ? upcomingPayments[0]['Due Date'] : null,
          next_due_amount: upcomingPayments.length > 0 ? parseFloat(upcomingPayments[0]['Total Amount'] || 0) : 0
        });
      }

      // Calculate summary statistics
      const summary = {
        total_active_loans: dashboardData.length,
        total_outstanding_principal: dashboardData.reduce((sum, loan) => sum + loan.outstanding_principal, 0),
        total_outstanding_interest: dashboardData.reduce((sum, loan) => sum + loan.outstanding_interest, 0),
        total_overdue_amount: dashboardData.reduce((sum, loan) => sum + loan.total_overdue_amount, 0),
        loans_with_overdue: dashboardData.filter(loan => loan.overdue_payments.length > 0).length,
        upcoming_payments_30_days: dashboardData.reduce((sum, loan) => sum + loan.upcoming_payments.length, 0)
      };

      res.json({
        success: true,
        data: {
          summary,
          loans: dashboardData
        }
      });

    } catch (error) {
      console.error('Interest dashboard error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch interest dashboard data',
        error: error.message
      });
    }
  }

  // GET /api/dashboard/interest/:borrowerId - Interest summary for a specific borrower
  static async getBorrowerInterestSummary(req, res) {
    try {
      const { borrowerId } = req.params;

      const member = await Member.findByPk(borrowerId, {
        include: [{
          model: Loan,
          include: [
            {
              model: Society,
              attributes: ['society_name']
            },
            {
              model: LoanProduct,
              attributes: ['product_name']
            }
          ]
        }]
      });

      if (!member) {
        return res.status(404).json({
          success: false,
          message: 'Member not found'
        });
      }

      const currentDate = new Date();
      const borrowerSummary = {
        member_id: member.member_id,
        member_name: member.member_name,
        membership_number: member.membership_number,
        contact_number: member.contact_number,
        email: member.email,
        total_loans: member.Loans?.length || 0,
        active_loans: 0,
        total_loan_amount: 0,
        total_outstanding_principal: 0,
        total_outstanding_interest: 0,
        total_overdue_amount: 0,
        loans_detail: []
      };

      for (const loan of member.Loans || []) {
        if (loan.loan_status === 'ACTIVE' || loan.loan_status === 'PENDING') {
          borrowerSummary.active_loans++;
        }

        borrowerSummary.total_loan_amount += parseFloat(loan.loan_amount || 0);
        borrowerSummary.total_outstanding_principal += parseFloat(loan.outstanding_principal || 0);
        borrowerSummary.total_outstanding_interest += parseFloat(loan.outstanding_interest || 0);

        const schedule = generateLoanSchedule(loan);
        const upcomingPayments = [];
        const overduePayments = [];

        schedule.forEach(payment => {
          const dueDate = new Date(payment['Due Date']);
          const daysDiff = Math.ceil((dueDate - currentDate) / (1000 * 60 * 60 * 24));

          if (payment.Status === 'PENDING' || payment.Status === 'PARTIAL') {
            if (daysDiff < 0) {
              overduePayments.push({
                ...payment,
                days_overdue: Math.abs(daysDiff)
              });
            } else if (daysDiff <= 30) {
              upcomingPayments.push({
                ...payment,
                days_until_due: daysDiff
              });
            }
          }
        });

        const loanOverdueAmount = overduePayments.reduce((sum, p) => sum + parseFloat(p['Total Amount'] || 0), 0);
        borrowerSummary.total_overdue_amount += loanOverdueAmount;

        borrowerSummary.loans_detail.push({
          loan_id: loan.loan_id,
          loan_number: loan.loan_number,
          society_name: loan.Society?.society_name || '',
          product_name: loan.LoanProduct?.product_name || '',
          loan_amount: parseFloat(loan.loan_amount || 0),
          outstanding_principal: parseFloat(loan.outstanding_principal || 0),
          outstanding_interest: parseFloat(loan.outstanding_interest || 0),
          loan_status: loan.loan_status,
          upcoming_payments,
          overdue_payments,
          overdue_amount: loanOverdueAmount,
          next_due_date: upcomingPayments.length > 0 ? upcomingPayments[0]['Due Date'] : null,
          next_due_amount: upcomingPayments.length > 0 ? parseFloat(upcomingPayments[0]['Total Amount'] || 0) : 0
        });
      }

      res.json({
        success: true,
        data: borrowerSummary
      });

    } catch (error) {
      console.error('Borrower interest summary error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch borrower interest summary',
        error: error.message
      });
    }
  }
}

module.exports = {
  getInterestDashboard: DashboardController.getInterestDashboard,
  getBorrowerInterestSummary: DashboardController.getBorrowerInterestSummary,
};