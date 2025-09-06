function generateLoanSchedule(loan) {
  if (!loan.disbursement_date || !loan.first_due_date) {
    return [];
  }

  const schedule = [];
  const loanAmount = parseFloat(loan.loan_amount || 0);
  const interestRate = parseFloat(loan.interest_rate || 0);
  const tenureMonths = parseInt(loan.tenure_months || 0);
  const monthlySavings = parseFloat(loan.monthly_savings || 0);

  // Calculate total interest for the entire loan period
  const totalInterest = (loanAmount * interestRate * tenureMonths) / (12 * 100);
  
  // Calculate monthly interest and principal
  const monthlyInterestRate = (interestRate / 100) / 12;
  const monthlyPrincipal = loanAmount / tenureMonths;
  const monthlyInterest = totalInterest / tenureMonths; // Distribute total interest evenly

  let currentDate = new Date(loan.first_due_date);
  let remainingPrincipal = loanAmount;
  let remainingInterest = totalInterest;

  for (let month = 1; month <= tenureMonths; month++) {
    const principalAmount = Math.min(monthlyPrincipal, remainingPrincipal);
    const interestAmount = Math.min(monthlyInterest, remainingInterest);
    const totalAmount = principalAmount + interestAmount + monthlySavings;

    schedule.push({
      'Month': month,
      'Due Date': currentDate.toISOString().split('T')[0],
      'Principal': principalAmount.toFixed(2),
      'Interest': interestAmount.toFixed(2),
      'Savings': monthlySavings.toFixed(2),
      'Total Amount': totalAmount.toFixed(2),
      'Remaining Principal': (remainingPrincipal - principalAmount).toFixed(2),
      'Remaining Interest': (remainingInterest - interestAmount).toFixed(2),
      'Status': 'PENDING',
      'Paid Date': null
    });

    remainingPrincipal -= principalAmount;
    remainingInterest -= interestAmount;
    currentDate.setMonth(currentDate.getMonth() + 1);
  }

  return schedule;
}

// New function to redistribute remaining amounts after payment
function redistributeRemainingAmounts(loanId, remainingPrincipal, remainingInterest, remainingMonths, monthlySavings, nextDueDate) {
  if (remainingMonths <= 0) {
    return [];
  }

  const schedule = [];
  let currentDate = new Date(nextDueDate);
  
  // Distribute remaining principal and interest evenly across remaining months
  const monthlyPrincipal = remainingPrincipal / remainingMonths;
  const monthlyInterest = remainingInterest / remainingMonths;
  
  let currentRemainingPrincipal = remainingPrincipal;
  let currentRemainingInterest = remainingInterest;

  for (let month = 1; month <= remainingMonths; month++) {
    const principalAmount = Math.min(monthlyPrincipal, currentRemainingPrincipal);
    const interestAmount = Math.min(monthlyInterest, currentRemainingInterest);
    const totalAmount = principalAmount + interestAmount + monthlySavings;

    schedule.push({
      'Month': month,
      'Due Date': currentDate.toISOString().split('T')[0],
      'Principal': principalAmount.toFixed(2),
      'Interest': interestAmount.toFixed(2),
      'Savings': monthlySavings.toFixed(2),
      'Total Amount': totalAmount.toFixed(2),
      'Remaining Principal': (currentRemainingPrincipal - principalAmount).toFixed(2),
      'Remaining Interest': (currentRemainingInterest - interestAmount).toFixed(2),
      'Status': 'PENDING',
      'Paid Date': null
    });

    currentRemainingPrincipal -= principalAmount;
    currentRemainingInterest -= interestAmount;
    currentDate.setMonth(currentDate.getMonth() + 1);
  }

  return schedule;
}

module.exports = {
  generateLoanSchedule,
  redistributeRemainingAmounts,
};