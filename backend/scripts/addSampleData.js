const { Loan, Member, Society, LoanOfficer, LoanProduct } = require('../models');

async function addSampleData() {
  try {
    console.log('Adding sample data to database...');

    // Check if data already exists
    const existingLoans = await Loan.count();
    if (existingLoans > 0) {
      console.log(`Database already has ${existingLoans} loans. Skipping sample data creation.`);
      return;
    }

    // Create sample society
    const society = await Society.create({
      society_name: 'Test Cooperative Society',
      registration_number: 'TEST001',
      address: '123 Test Street, Test City',
      contact_number: '9876543210',
      email: 'test@coop.com',
      established_date: new Date('2020-01-01'),
      status: 'ACTIVE'
    });

    // Create sample loan officer
    const officer = await LoanOfficer.create({
      officer_name: 'Test Officer',
      employee_id: 'EMP001',
      society_id: society.society_id,
      contact_number: '9876543210',
      email: 'officer@test.com',
      password: '$2b$10$example', // This would be hashed in real scenario
      role: 'admin',
      designation: 'Manager',
      hire_date: new Date('2020-01-01'),
      status: 'ACTIVE'
    });

    // Create sample loan product
    const product = await LoanProduct.create({
      product_name: 'Test Loan Product',
      society_id: society.society_id,
      interest_rate: 12.0,
      processing_fee_rate: 1.0,
      min_amount: 10000,
      max_amount: 500000,
      min_tenure_months: 6,
      max_tenure_months: 60,
      monthly_savings_required: 200,
      savings_interest_rate: 6.0,
      penalty_amount: 100,
      status: 'ACTIVE'
    });

    // Create sample member
    const member = await Member.create({
      member_name: 'Test Member',
      membership_number: 'MEM001',
      society_id: society.society_id,
      contact_number: '9876543210',
      email: 'member@test.com',
      address: '456 Member Street, Test City'
    });

    // Create sample loan
    const loan = await Loan.create({
      loan_number: 'LOAN001',
      member_id: member.member_id,
      society_id: society.society_id,
      officer_id: officer.officer_id,
      product_id: product.product_id,
      loan_amount: 100000,
      interest_rate: 12.0,
      tenure_months: 24,
      processing_fee: 1000,
      monthly_savings: 200,
      disbursement_date: new Date(),
      first_due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      last_due_date: new Date(Date.now() + 24 * 30 * 24 * 60 * 60 * 1000), // 24 months from now
      total_interest: 24000,
      total_payable: 124000,
      outstanding_principal: 100000,
      outstanding_interest: 24000,
      loan_status: 'ACTIVE'
    });

    console.log('Sample data created successfully!');
    console.log('- Society:', society.society_name);
    console.log('- Officer:', officer.officer_name);
    console.log('- Product:', product.product_name);
    console.log('- Member:', member.member_name);
    console.log('- Loan:', loan.loan_number);

  } catch (error) {
    console.error('Error adding sample data:', error);
  } finally {
    process.exit(0);
  }
}

addSampleData();
