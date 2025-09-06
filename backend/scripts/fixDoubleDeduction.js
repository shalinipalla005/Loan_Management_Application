const { Loan, Payment } = require('../models');
const sequelize = require('../config/database');

async function fixDoubleDeduction() {
  try {
    console.log('Starting fix for double deduction of outstanding amounts...');
    
    // Get all loans with their payments
    const loans = await Loan.findAll({
      include: [
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
      
      const currentOutstandingPrincipal = parseFloat(loan.outstanding_principal);
      const currentOutstandingInterest = parseFloat(loan.outstanding_interest);
      
      console.log(`  Current outstanding: Principal=${currentOutstandingPrincipal}, Interest=${currentOutstandingInterest}`);
      console.log(`  Correct outstanding: Principal=${correctOutstandingPrincipal}, Interest=${correctOutstandingInterest}`);
      console.log(`  Total payments: Principal=${totalPrincipalPaid}, Interest=${totalInterestPaid}, Penalty=${totalPenaltyPaid}`);
      
      // Update loan if amounts are different
      if (Math.abs(currentOutstandingPrincipal - correctOutstandingPrincipal) > 0.01 ||
          Math.abs(currentOutstandingInterest - correctOutstandingInterest) > 0.01) {
        
        // Determine correct loan status
        let newStatus = loan.loan_status;
        if (correctOutstandingPrincipal <= 0 && correctOutstandingInterest <= 0) {
          newStatus = 'CLOSED';
        } else if (loan.loan_status === 'PENDING' && (totalPrincipalPaid > 0 || totalInterestPaid > 0)) {
          newStatus = 'ACTIVE';
        }
        
        await loan.update({
          outstanding_principal: correctOutstandingPrincipal.toFixed(2),
          outstanding_interest: correctOutstandingInterest.toFixed(2),
          loan_status: newStatus
        });
        
        console.log(`  ✅ Updated loan with correct outstanding amounts and status: ${newStatus}`);
      } else {
        console.log(`  ✅ Loan amounts are already correct`);
      }
    }

    console.log('\nFix completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error fixing double deduction:', error);
    process.exit(1);
  }
}

// Run the fix
fixDoubleDeduction();
