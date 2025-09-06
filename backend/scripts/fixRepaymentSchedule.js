const { Loan, RepaymentSchedule, Payment } = require('../models');
const sequelize = require('../config/database');

async function fixRepaymentSchedule() {
  try {
    console.log('Starting repayment schedule fix...');
    
    // Get all loans with their schedules and payments
    const loans = await Loan.findAll({
      include: [
        {
          model: RepaymentSchedule,
          as: 'RepaymentSchedules',
          order: [['installment_number', 'ASC']]
        },
        {
          model: Payment,
          as: 'Payments',
          order: [['payment_date', 'ASC']]
        }
      ]
    });

    for (const loan of loans) {
      console.log(`\nProcessing loan: ${loan.loan_number}`);
      
      // Calculate correct outstanding amounts by summing all payments
      const totalPrincipalPaid = loan.Payments.reduce((sum, payment) => 
        sum + parseFloat(payment.principal_paid || 0), 0
      );
      const totalInterestPaid = loan.Payments.reduce((sum, payment) => 
        sum + parseFloat(payment.interest_paid || 0), 0
      );
      const totalPenaltyPaid = loan.Payments.reduce((sum, payment) => 
        sum + parseFloat(payment.penalty_paid || 0), 0
      );
      
      // Calculate correct outstanding amounts
      const originalLoanAmount = parseFloat(loan.loan_amount);
      const originalTotalInterest = parseFloat(loan.total_interest || 0);
      
      const correctOutstandingPrincipal = Math.max(0, originalLoanAmount - totalPrincipalPaid + totalPenaltyPaid);
      const correctOutstandingInterest = Math.max(0, originalTotalInterest - totalInterestPaid);
      
      console.log(`  Original: Principal=${originalLoanAmount}, Interest=${originalTotalInterest}`);
      console.log(`  Paid: Principal=${totalPrincipalPaid}, Interest=${totalInterestPaid}, Penalty=${totalPenaltyPaid}`);
      console.log(`  Correct Outstanding: Principal=${correctOutstandingPrincipal}, Interest=${correctOutstandingInterest}`);
      
      // Update loan outstanding amounts
      await loan.update({
        outstanding_principal: correctOutstandingPrincipal.toFixed(2),
        outstanding_interest: correctOutstandingInterest.toFixed(2)
      });
      
      // Delete all existing schedules
      await RepaymentSchedule.destroy({
        where: { loan_id: loan.loan_id }
      });
      
      // Regenerate schedules based on remaining amounts
      const remainingMonths = loan.tenure_months;
      const monthlySavings = parseFloat(loan.monthly_savings || 200);
      
      // Calculate monthly amounts
      const monthlyPrincipal = correctOutstandingPrincipal / remainingMonths;
      const monthlyInterest = correctOutstandingInterest / remainingMonths;
      
      // Create new schedules
      const schedules = [];
      let currentDate = new Date(loan.first_due_date);
      let currentPrincipal = correctOutstandingPrincipal;
      let currentInterest = correctOutstandingInterest;
      
      for (let i = 1; i <= remainingMonths; i++) {
        const principalAmount = Math.min(monthlyPrincipal, currentPrincipal);
        const interestAmount = Math.min(monthlyInterest, currentInterest);
        const totalAmount = principalAmount + interestAmount + monthlySavings;
        
        // Check if this installment has been paid
        const installmentPayments = loan.Payments.filter(p => p.installment_number === i);
        const paidAmount = installmentPayments.reduce((sum, p) => sum + parseFloat(p.payment_amount || 0), 0);
        
        let paymentStatus = 'PENDING';
        let paidDate = null;
        
        if (paidAmount >= totalAmount) {
          paymentStatus = 'PAID';
          paidDate = installmentPayments[0]?.payment_date || null;
        } else if (paidAmount > 0) {
          paymentStatus = 'PARTIAL';
          paidDate = installmentPayments[0]?.payment_date || null;
        }
        
        schedules.push({
          loan_id: loan.loan_id,
          installment_number: i,
          due_date: currentDate,
          opening_balance: currentPrincipal.toFixed(2),
          principal_amount: principalAmount.toFixed(2),
          interest_amount: interestAmount.toFixed(2),
          monthly_savings: monthlySavings.toFixed(2),
          total_installment: totalAmount.toFixed(2),
          closing_balance: (currentPrincipal - principalAmount).toFixed(2),
          payment_status: paymentStatus,
          paid_date: paidDate,
          paid_amount: paidAmount.toFixed(2),
          penalty_applied: 0.00
        });
        
        currentPrincipal -= principalAmount;
        currentInterest -= interestAmount;
        currentDate.setMonth(currentDate.getMonth() + 1);
      }
      
      // Insert new schedules
      await RepaymentSchedule.bulkCreate(schedules);
      console.log(`  ✅ Created ${schedules.length} schedules for loan ${loan.loan_number}`);
    }

    console.log('\nRepayment schedule fix completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error fixing repayment schedule:', error);
    process.exit(1);
  }
}

// Run the fix
fixRepaymentSchedule();
