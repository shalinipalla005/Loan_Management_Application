const { Loan, RepaymentSchedule, Payment } = require('../models');
const sequelize = require('../config/database');

async function testRedistribution() {
  try {
    console.log('Testing redistribution for loan LOAN20250906003...');
    
    // Get the specific loan
    const loan = await Loan.findOne({
      where: { loan_number: 'LOAN20250906003' },
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

    if (!loan) {
      console.log('Loan not found');
      return;
    }

    console.log('\n=== CURRENT LOAN STATE ===');
    console.log('Loan Amount:', loan.loan_amount);
    console.log('Outstanding Principal:', loan.outstanding_principal);
    console.log('Outstanding Interest:', loan.outstanding_interest);
    console.log('Total Interest:', loan.total_interest);

    console.log('\n=== PAYMENTS ===');
    loan.Payments.forEach(payment => {
      console.log(`Payment: ₹${payment.payment_amount} (Principal: ₹${payment.principal_paid}, Interest: ₹${payment.interest_paid})`);
    });

    console.log('\n=== CURRENT SCHEDULES ===');
    loan.RepaymentSchedules.forEach(schedule => {
      console.log(`Installment ${schedule.installment_number}: ${schedule.payment_status} - Paid: ₹${schedule.paid_amount}/${schedule.total_installment}`);
    });

    // Calculate what the outstanding amounts should be
    const totalPrincipalPaid = loan.Payments.reduce((sum, payment) => 
      sum + parseFloat(payment.principal_paid || 0), 0
    );
    const totalInterestPaid = loan.Payments.reduce((sum, payment) => 
      sum + parseFloat(payment.interest_paid || 0), 0
    );
    const totalPenaltyPaid = loan.Payments.reduce((sum, payment) => 
      sum + parseFloat(payment.penalty_paid || 0), 0
    );

    const correctOutstandingPrincipal = Math.max(0, parseFloat(loan.loan_amount) - totalPrincipalPaid + totalPenaltyPaid);
    const correctOutstandingInterest = Math.max(0, parseFloat(loan.total_interest) - totalInterestPaid);

    console.log('\n=== CALCULATED OUTSTANDING AMOUNTS ===');
    console.log('Should be - Principal:', correctOutstandingPrincipal, 'Interest:', correctOutstandingInterest);
    console.log('Actually - Principal:', loan.outstanding_principal, 'Interest:', loan.outstanding_interest);

    // Update loan if needed
    if (Math.abs(correctOutstandingPrincipal - parseFloat(loan.outstanding_principal)) > 0.01 ||
        Math.abs(correctOutstandingInterest - parseFloat(loan.outstanding_interest)) > 0.01) {
      
      console.log('\nUpdating loan outstanding amounts...');
      await loan.update({
        outstanding_principal: correctOutstandingPrincipal.toFixed(2),
        outstanding_interest: correctOutstandingInterest.toFixed(2)
      });
    }

    // Now test redistribution
    console.log('\n=== TESTING REDISTRIBUTION ===');
    
    // Delete all schedules except the first one (which should be paid)
    const firstSchedule = loan.RepaymentSchedules.find(s => s.installment_number === 1);
    if (firstSchedule) {
      console.log('Keeping first schedule as PAID:', firstSchedule.schedule_id);
    }

    // Delete all other schedules
    await RepaymentSchedule.destroy({
      where: {
        loan_id: loan.loan_id,
        installment_number: { [sequelize.Sequelize.Op.gt]: 1 }
      }
    });

    // Get updated loan
    const updatedLoan = await Loan.findByPk(loan.loan_id);
    
    // Redistribute remaining amounts
    const remainingPrincipal = parseFloat(updatedLoan.outstanding_principal);
    const remainingInterest = parseFloat(updatedLoan.outstanding_interest);
    const remainingMonths = 23; // 24 total - 1 paid
    const monthlySavings = parseFloat(updatedLoan.monthly_savings || 200);

    console.log('Redistributing:', {
      remainingPrincipal,
      remainingInterest,
      remainingMonths,
      monthlySavings
    });

    // Calculate new monthly amounts
    const monthlyPrincipal = remainingPrincipal / remainingMonths;
    const monthlyInterest = remainingInterest / remainingMonths;

    console.log('New monthly amounts:', {
      monthlyPrincipal: monthlyPrincipal.toFixed(2),
      monthlyInterest: monthlyInterest.toFixed(2),
      monthlySavings: monthlySavings.toFixed(2)
    });

    // Create new schedules
    const newSchedules = [];
    let currentDate = new Date('2025-10-06'); // Next month after first installment
    let currentOpeningBalance = remainingPrincipal;

    for (let i = 2; i <= 24; i++) {
      const principalAmount = Math.min(monthlyPrincipal, currentOpeningBalance);
      const interestAmount = monthlyInterest;
      const totalAmount = principalAmount + interestAmount + monthlySavings;

      newSchedules.push({
        loan_id: loan.loan_id,
        installment_number: i,
        due_date: currentDate,
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
      });

      currentOpeningBalance -= principalAmount;
      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    await RepaymentSchedule.bulkCreate(newSchedules);
    console.log(`Created ${newSchedules.length} new schedules`);

    // Show final result
    const finalLoan = await Loan.findByPk(loan.loan_id, {
      include: [{
        model: RepaymentSchedule,
        as: 'RepaymentSchedules',
        order: [['installment_number', 'ASC']]
      }]
    });

    console.log('\n=== FINAL SCHEDULES ===');
    finalLoan.RepaymentSchedules.forEach(schedule => {
      console.log(`Installment ${schedule.installment_number}: ${schedule.payment_status} - ₹${schedule.total_installment} (Paid: ₹${schedule.paid_amount})`);
    });

    console.log('\nRedistribution test completed!');
    process.exit(0);
  } catch (error) {
    console.error('Error testing redistribution:', error);
    process.exit(1);
  }
}

// Run the test
testRedistribution();
