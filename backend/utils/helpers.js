function generateLoanSchedule(loan) {
  if (!loan.disbursement_date || !loan.first_due_date) {
    return [];
  }

  const schedule = [];
  const loanAmount = parseFloat(loan.loan_amount || 0);
  const interestRate = parseFloat(loan.interest_rate || 0);
  const tenureMonths = parseInt(loan.tenure_months || 0);
  const monthlySavings = parseFloat(loan.monthly_savings || 0);

  // Calculate monthly interest and principal
  const monthlyInterestRate = (interestRate / 100) / 12;
  const monthlyPrincipal = loanAmount / tenureMonths;
  const monthlyInterest = loanAmount * monthlyInterestRate;

  let currentDate = new Date(loan.first_due_date);
  let remainingPrincipal = loanAmount;

  for (let month = 1; month <= tenureMonths; month++) {
    const principalAmount = Math.min(monthlyPrincipal, remainingPrincipal);
    const interestAmount = monthlyInterest;
    const totalAmount = principalAmount + interestAmount + monthlySavings;

    schedule.push({
      'Month': month,
      'Due Date': currentDate.toISOString().split('T')[0],
      'Principal': principalAmount.toFixed(2),
      'Interest': interestAmount.toFixed(2),
      'Savings': monthlySavings.toFixed(2),
      'Total Amount': totalAmount.toFixed(2),
      'Remaining Principal': (remainingPrincipal - principalAmount).toFixed(2),
      'Status': 'PENDING', // This would be updated based on actual payments
      'Paid Date': null
    });

    remainingPrincipal -= principalAmount;
    currentDate.setMonth(currentDate.getMonth() + 1);
  }

  return schedule;
}

module.exports = {
  generateLoanSchedule,
};