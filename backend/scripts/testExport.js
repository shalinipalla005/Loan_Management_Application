const { Loan, Member, Society, LoanOfficer, LoanProduct } = require('../models');

async function testExport() {
  try {
    console.log('Testing export functionality...');
    
    // First, test basic loan query
    const basicLoans = await Loan.findAll({ limit: 1 });
    console.log('Basic loan query result:', basicLoans.length);
    
    // Test the same query as in exportAllLoans
    const loans = await Loan.findAll({
      include: [
        {
          model: Member,
          as: 'member',
          attributes: ['member_name', 'membership_number', 'contact_number', 'email']
        },
        {
          model: Society,
          as: 'Society',
          attributes: ['society_name']
        },
        {
          model: LoanOfficer,
          as: 'LoanOfficer',
          attributes: ['officer_name']
        },
        {
          model: LoanProduct,
          as: 'LoanProduct',
          attributes: ['product_name', 'interest_rate', 'processing_fee_rate']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    console.log(`Found ${loans.length} loans`);
    
    if (loans.length > 0) {
      console.log('First loan data:');
      console.log('- Loan ID:', loans[0].loan_id);
      console.log('- Loan Number:', loans[0].loan_number);
      console.log('- Member Name:', loans[0].member?.member_name);
      console.log('- Society Name:', loans[0].Society?.society_name);
      console.log('- Officer Name:', loans[0].LoanOfficer?.officer_name);
      console.log('- Product Name:', loans[0].LoanProduct?.product_name);
    } else {
      console.log('No loans found in database');
    }

    // Test data transformation
    const exportData = loans.map(loan => ({
      'Loan ID': loan.loan_id,
      'Loan Number': loan.loan_number,
      'Member Name': loan.member?.member_name || '',
      'Membership Number': loan.member?.membership_number || '',
      'Contact': loan.member?.contact_number || '',
      'Email': loan.member?.email || '',
      'Society': loan.Society?.society_name || '',
      'Officer': loan.LoanOfficer?.officer_name || '',
      'Product': loan.LoanProduct?.product_name || '',
      'Loan Amount': parseFloat(loan.loan_amount || 0),
      'Interest Rate': parseFloat(loan.interest_rate || 0),
      'Tenure (Months)': loan.tenure_months || 0,
      'Processing Fee': parseFloat(loan.processing_fee || 0),
      'Monthly Savings': parseFloat(loan.monthly_savings || 0),
      'Disbursement Date': loan.disbursement_date ? new Date(loan.disbursement_date).toISOString().split('T')[0] : '',
      'First Due Date': loan.first_due_date ? new Date(loan.first_due_date).toISOString().split('T')[0] : '',
      'Last Due Date': loan.last_due_date ? new Date(loan.last_due_date).toISOString().split('T')[0] : '',
      'Total Interest': parseFloat(loan.total_interest || 0),
      'Total Payable': parseFloat(loan.total_payable || 0),
      'Outstanding Principal': parseFloat(loan.outstanding_principal || 0),
      'Outstanding Interest': parseFloat(loan.outstanding_interest || 0),
      'Loan Status': loan.loan_status || '',
      'Created At': loan.created_at ? new Date(loan.created_at).toISOString().split('T')[0] : ''
    }));

    console.log(`Transformed ${exportData.length} records`);
    
    if (exportData.length > 0) {
      console.log('First transformed record:');
      console.log(JSON.stringify(exportData[0], null, 2));
    }

  } catch (error) {
    console.error('Error testing export:', error);
  } finally {
    process.exit(0);
  }
}

testExport();
