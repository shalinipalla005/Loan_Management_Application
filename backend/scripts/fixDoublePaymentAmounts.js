const { Loan, RepaymentSchedule, Payment } = require('../models');
const sequelize = require('../config/database');

async function fixDoublePaymentAmounts() {
  try {
    console.log('Starting fix for double payment amounts...');
    
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
      
      // Group payments by schedule_id
      const paymentsBySchedule = {};
      loan.Payments.forEach(payment => {
        if (payment.schedule_id) {
          if (!paymentsBySchedule[payment.schedule_id]) {
            paymentsBySchedule[payment.schedule_id] = [];
          }
          paymentsBySchedule[payment.schedule_id].push(payment);
        }
      });

      // Fix each schedule
      for (const schedule of loan.RepaymentSchedules) {
        const payments = paymentsBySchedule[schedule.schedule_id] || [];
        
        if (payments.length > 0) {
          // Calculate correct paid_amount by summing all payments for this schedule
          const correctPaidAmount = payments.reduce((sum, payment) => 
            sum + parseFloat(payment.payment_amount || 0), 0
          );
          
          const currentPaidAmount = parseFloat(schedule.paid_amount || 0);
          
          if (Math.abs(currentPaidAmount - correctPaidAmount) > 0.01) {
            console.log(`  Schedule ${schedule.installment_number}: ${currentPaidAmount} → ${correctPaidAmount}`);
            
            // Update the schedule with correct paid_amount
            const totalRequired = parseFloat(schedule.total_installment);
            let newStatus;
            if (correctPaidAmount >= totalRequired) {
              newStatus = 'PAID';
            } else if (correctPaidAmount > 0) {
              newStatus = 'PARTIAL';
            } else {
              newStatus = 'PENDING';
            }
            
            await schedule.update({
              paid_amount: correctPaidAmount.toFixed(2),
              payment_status: newStatus
            });
          }
        }
      }
    }

    console.log('\nFix completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error fixing double payment amounts:', error);
    process.exit(1);
  }
}

// Run the fix
fixDoublePaymentAmounts();
