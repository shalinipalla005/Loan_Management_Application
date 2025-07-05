const { Loan, Member, Society, LoanOfficer, LoanProduct, sequelize } = require('../models');
const { Op } = require('sequelize');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const { generateLoanSchedule } = require('../utils/helpers');

class ExportController {
  // GET /api/loans/export - Export all loans
  static async exportAllLoans(req, res) {
    try {
      const loans = await Loan.findAll({
        include: [
          {
            model: Member,
            attributes: ['member_name', 'membership_number', 'contact_number', 'email']
          },
          {
            model: Society,
            attributes: ['society_name']
          },
          {
            model: LoanOfficer,
            attributes: ['officer_name']
          },
          {
            model: LoanProduct,
            attributes: ['product_name', 'interest_rate', 'processing_fee_rate']
          }
        ],
        order: [['created_at', 'DESC']]
      });

      // Transform data for export
      const exportData = loans.map(loan => ({
        'Loan ID': loan.loan_id,
        'Loan Number': loan.loan_number,
        'Member Name': loan.Member?.member_name || '',
        'Membership Number': loan.Member?.membership_number || '',
        'Contact': loan.Member?.contact_number || '',
        'Email': loan.Member?.email || '',
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

      // Create Excel workbook
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      
      // Set column widths
      const colWidths = Object.keys(exportData[0] || {}).map(key => ({
        wch: Math.max(key.length, 15)
      }));
      worksheet['!cols'] = colWidths;

      XLSX.utils.book_append_sheet(workbook, worksheet, 'All Loans');

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
      const filename = `all_loans_export_${timestamp}.xlsx`;
      
      // Create buffer
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      // Set headers and send file
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.send(buffer);

    } catch (error) {
      console.error('Export all loans error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to export loan data',
        error: error.message
      });
    }
  }

  // GET /api/loans/:loanId/export - Export specific loan
  static async exportSpecificLoan(req, res) {
    try {
      const { loanId } = req.params;

      const loan = await Loan.findOne({
        where: { loan_id: loanId },
        include: [
          {
            model: Member,
            attributes: ['member_name', 'membership_number', 'contact_number', 'email', 'address']
          },
          {
            model: Society,
            attributes: ['society_name']
          },
          {
            model: LoanOfficer,
            attributes: ['officer_name', 'contact_number']
          },
          {
            model: LoanProduct,
            attributes: ['product_name', 'interest_rate', 'processing_fee_rate', 'monthly_savings_required']
          }
        ]
      });

      if (!loan) {
        return res.status(404).json({
          success: false,
          message: 'Loan not found'
        });
      }

      // Generate loan schedule
      const schedule = generateLoanSchedule(loan);

      // Prepare loan profile data
      const loanProfileData = [{
        'Field': 'Loan ID',
        'Value': loan.loan_id
      }, {
        'Field': 'Loan Number',
        'Value': loan.loan_number
      }, {
        'Field': 'Member Name',
        'Value': loan.Member?.member_name || ''
      }, {
        'Field': 'Membership Number',
        'Value': loan.Member?.membership_number || ''
      }, {
        'Field': 'Contact Number',
        'Value': loan.Member?.contact_number || ''
      }, {
        'Field': 'Email',
        'Value': loan.Member?.email || ''
      }, {
        'Field': 'Address',
        'Value': loan.Member?.address || ''
      }, {
        'Field': 'Society',
        'Value': loan.Society?.society_name || ''
      }, {
        'Field': 'Loan Officer',
        'Value': loan.LoanOfficer?.officer_name || ''
      }, {
        'Field': 'Product Name',
        'Value': loan.LoanProduct?.product_name || ''
      }, {
        'Field': 'Loan Amount',
        'Value': parseFloat(loan.loan_amount || 0)
      }, {
        'Field': 'Interest Rate (%)',
        'Value': parseFloat(loan.interest_rate || 0)
      }, {
        'Field': 'Tenure (Months)',
        'Value': loan.tenure_months || 0
      }, {
        'Field': 'Processing Fee',
        'Value': parseFloat(loan.processing_fee || 0)
      }, {
        'Field': 'Monthly Savings',
        'Value': parseFloat(loan.monthly_savings || 0)
      }, {
        'Field': 'Total Interest',
        'Value': parseFloat(loan.total_interest || 0)
      }, {
        'Field': 'Total Payable',
        'Value': parseFloat(loan.total_payable || 0)
      }, {
        'Field': 'Outstanding Principal',
        'Value': parseFloat(loan.outstanding_principal || 0)
      }, {
        'Field': 'Outstanding Interest',
        'Value': parseFloat(loan.outstanding_interest || 0)
      }, {
        'Field': 'Loan Status',
        'Value': loan.loan_status || ''
      }, {
        'Field': 'Disbursement Date',
        'Value': loan.disbursement_date ? new Date(loan.disbursement_date).toISOString().split('T')[0] : ''
      }, {
        'Field': 'First Due Date',
        'Value': loan.first_due_date ? new Date(loan.first_due_date).toISOString().split('T')[0] : ''
      }, {
        'Field': 'Last Due Date',
        'Value': loan.last_due_date ? new Date(loan.last_due_date).toISOString().split('T')[0] : ''
      }, {
        'Field': 'Created At',
        'Value': loan.created_at ? new Date(loan.created_at).toISOString().split('T')[0] : ''
      }];

      // Create Excel workbook
      const workbook = XLSX.utils.book_new();
      
      // Add loan profile sheet
      const profileSheet = XLSX.utils.json_to_sheet(loanProfileData);
      profileSheet['!cols'] = [{ wch: 25 }, { wch: 30 }];
      XLSX.utils.book_append_sheet(workbook, profileSheet, 'Loan Profile');
      
      // Add schedule sheet if available
      if (schedule && schedule.length > 0) {
        const scheduleSheet = XLSX.utils.json_to_sheet(schedule);
        scheduleSheet['!cols'] = [
          { wch: 10 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, 
          { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 15 }
        ];
        XLSX.utils.book_append_sheet(workbook, scheduleSheet, 'Payment Schedule');
      }

      const filename = `loan_${loan.loan_number}_export.xlsx`;
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.send(buffer);

    } catch (error) {
      console.error('Export specific loan error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to export loan data',
        error: error.message
      });
    }
  }

  // POST /api/loans/import - Import backup data
  static async importBackupData(req, res) {
    const transaction = await sequelize.transaction();
    
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }

      // Read Excel file
      const workbook = XLSX.readFile(req.file.path);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const importData = XLSX.utils.sheet_to_json(worksheet);

      let successCount = 0;
      let errorCount = 0;
      const errors = [];

      for (const row of importData) {
        try {
          if (!row['Loan Number'] || !row['Member Name']) {
            errors.push(`Row ${successCount + errorCount + 2}: Missing required fields`);
            errorCount++;
            continue;
          }

          let member = await Member.findOne({
            where: { membership_number: row['Membership Number'] },
            transaction
          });

          if (!member) {
            member = await Member.create({
              member_name: row['Member Name'],
              membership_number: row['Membership Number'] || `MEM${Date.now()}`,
              society_id: 1, // Default society, should be configurable
              contact_number: row['Contact'] || null,
              email: row['Email'] || null
            }, { transaction });
          }

          // Create or update loan
          const loanData = {
            loan_number: row['Loan Number'],
            member_id: member.member_id,
            society_id: 1, // default society
            officer_id: 1, 
            product_id: 1, 
            loan_amount: parseFloat(row['Loan Amount']) || 0,
            interest_rate: parseFloat(row['Interest Rate']) || 0,
            tenure_months: parseInt(row['Tenure (Months)']) || 12,
            processing_fee: parseFloat(row['Processing Fee']) || 0,
            monthly_savings: parseFloat(row['Monthly Savings']) || 200,
            disbursement_date: row['Disbursement Date'] ? new Date(row['Disbursement Date']) : null,
            first_due_date: row['First Due Date'] ? new Date(row['First Due Date']) : null,
            last_due_date: row['Last Due Date'] ? new Date(row['Last Due Date']) : null,
            total_interest: parseFloat(row['Total Interest']) || 0,
            total_payable: parseFloat(row['Total Payable']) || 0,
            outstanding_principal: parseFloat(row['Outstanding Principal']) || 0,
            outstanding_interest: parseFloat(row['Outstanding Interest']) || 0,
            loan_status: row['Loan Status'] || 'PENDING'
          };

          await Loan.upsert(loanData, { transaction });
          successCount++;

        } catch (rowError) {
          errors.push(`Row ${successCount + errorCount + 2}: ${rowError.message}`);
          errorCount++;
        }
      }

      // Clean up uploaded file
      fs.unlinkSync(req.file.path);

      await transaction.commit();

      res.json({
        success: true,
        message: 'Import completed',
        summary: {
          total_rows: importData.length,
          successful_imports: successCount,
          failed_imports: errorCount,
          errors: errors.slice(0, 10) // Show first 10 errors
        }
      });

    } catch (error) {
      await transaction.rollback();
      
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }

      console.error('Import backup data error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to import backup data',
        error: error.message
      });
    }
  }
}

module.exports = {
  exportAllLoans: ExportController.exportAllLoans,
  exportSpecificLoan: ExportController.exportSpecificLoan,
  importBackupData: ExportController.importBackupData,
};