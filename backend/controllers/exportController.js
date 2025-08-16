const { Loan, Member, Society, LoanOfficer, LoanProduct, sequelize } = require('../models');
const { Op } = require('sequelize');
const excel4node = require('excel4node');
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

      // Create a new workbook and worksheet
      const workbook = new excel4node.Workbook({
        defaultFont: {
          size: 11,
          name: 'Calibri'
        }
      });
      const worksheet = workbook.addWorksheet('All Loans');

      // Create styles
      const headerStyle = workbook.createStyle({
        font: {
          bold: true,
          color: '#000000',
        },
        fill: {
          type: 'pattern',
          patternType: 'solid',
          fgColor: '#CCCCCC'
        },
        border: {
          left: { style: 'thin', color: '#000000' },
          right: { style: 'thin', color: '#000000' },
          top: { style: 'thin', color: '#000000' },
          bottom: { style: 'thin', color: '#000000' }
        }
      });

      const cellStyle = workbook.createStyle({
        border: {
          left: { style: 'thin', color: '#000000' },
          right: { style: 'thin', color: '#000000' },
          top: { style: 'thin', color: '#000000' },
          bottom: { style: 'thin', color: '#000000' }
        }
      });

      const numberStyle = workbook.createStyle({
        numberFormat: '#,##0.00',
        border: {
          left: { style: 'thin', color: '#000000' },
          right: { style: 'thin', color: '#000000' },
          top: { style: 'thin', color: '#000000' },
          bottom: { style: 'thin', color: '#000000' }
        }
      });

      const dateStyle = workbook.createStyle({
        numberFormat: 'yyyy-mm-dd',
        border: {
          left: { style: 'thin', color: '#000000' },
          right: { style: 'thin', color: '#000000' },
          top: { style: 'thin', color: '#000000' },
          bottom: { style: 'thin', color: '#000000' }
        }
      });

      // Write headers
      const headers = Object.keys(exportData[0] || {});
      headers.forEach((header, index) => {
        worksheet.cell(1, index + 1)
          .string(header)
          .style(headerStyle);
        
        // Set column width based on header length
        worksheet.column(index + 1).setWidth(Math.max(header.length + 2, 15));
      });

      // Write data
      exportData.forEach((row, rowIndex) => {
        headers.forEach((header, colIndex) => {
          const cell = worksheet.cell(rowIndex + 2, colIndex + 1);
          const value = row[header];

          if (typeof value === 'number') {
            cell.number(value).style(numberStyle);
          } else if (header.toLowerCase().includes('date') && value && value !== '') {
            // Handle date strings properly
            try {
              const dateValue = new Date(value);
              if (!isNaN(dateValue.getTime())) {
                cell.date(dateValue).style(dateStyle);
              } else {
                cell.string(value.toString()).style(cellStyle);
              }
            } catch (e) {
              cell.string(value.toString()).style(cellStyle);
            }
          } else {
            cell.string(value ? value.toString() : '').style(cellStyle);
          }
        });
      });

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
      const filename = `all_loans_export_${timestamp}.xlsx`;

      // Write to buffer
      workbook.writeToBuffer().then(buffer => {
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(buffer);
      }).catch(err => {
        console.error('Error generating Excel file:', err);
        res.status(500).json({
          success: false,
          message: 'Failed to generate Excel file',
          error: err.message
        });
      });

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

      // Create Excel workbook using excel4node
      const workbook = new excel4node.Workbook({
        defaultFont: {
          size: 11,
          name: 'Calibri'
        }
      });

      // Create styles
      const headerStyle = workbook.createStyle({
        font: { bold: true, color: '#000000' },
        fill: { type: 'pattern', patternType: 'solid', fgColor: '#CCCCCC' },
        border: {
          left: { style: 'thin', color: '#000000' },
          right: { style: 'thin', color: '#000000' },
          top: { style: 'thin', color: '#000000' },
          bottom: { style: 'thin', color: '#000000' }
        }
      });

      const cellStyle = workbook.createStyle({
        border: {
          left: { style: 'thin', color: '#000000' },
          right: { style: 'thin', color: '#000000' },
          top: { style: 'thin', color: '#000000' },
          bottom: { style: 'thin', color: '#000000' }
        }
      });

      const numberStyle = workbook.createStyle({
        numberFormat: '#,##0.00',
        border: {
          left: { style: 'thin', color: '#000000' },
          right: { style: 'thin', color: '#000000' },
          top: { style: 'thin', color: '#000000' },
          bottom: { style: 'thin', color: '#000000' }
        }
      });

      // Add loan profile sheet
      const profileSheet = workbook.addWorksheet('Loan Profile');
      
      const loanProfileData = [
        ['Loan ID', loan.loan_id],
        ['Loan Number', loan.loan_number],
        ['Member Name', loan.Member?.member_name || ''],
        ['Membership Number', loan.Member?.membership_number || ''],
        ['Contact Number', loan.Member?.contact_number || ''],
        ['Email', loan.Member?.email || ''],
        ['Address', loan.Member?.address || ''],
        ['Society', loan.Society?.society_name || ''],
        ['Loan Officer', loan.LoanOfficer?.officer_name || ''],
        ['Product Name', loan.LoanProduct?.product_name || ''],
        ['Loan Amount', parseFloat(loan.loan_amount || 0)],
        ['Interest Rate (%)', parseFloat(loan.interest_rate || 0)],
        ['Tenure (Months)', loan.tenure_months || 0],
        ['Processing Fee', parseFloat(loan.processing_fee || 0)],
        ['Monthly Savings', parseFloat(loan.monthly_savings || 0)],
        ['Total Interest', parseFloat(loan.total_interest || 0)],
        ['Total Payable', parseFloat(loan.total_payable || 0)],
        ['Outstanding Principal', parseFloat(loan.outstanding_principal || 0)],
        ['Outstanding Interest', parseFloat(loan.outstanding_interest || 0)],
        ['Loan Status', loan.loan_status || ''],
        ['Disbursement Date', loan.disbursement_date ? new Date(loan.disbursement_date).toISOString().split('T')[0] : ''],
        ['First Due Date', loan.first_due_date ? new Date(loan.first_due_date).toISOString().split('T')[0] : ''],
        ['Last Due Date', loan.last_due_date ? new Date(loan.last_due_date).toISOString().split('T')[0] : ''],
        ['Created At', loan.created_at ? new Date(loan.created_at).toISOString().split('T')[0] : '']
      ];

      // Write profile data
      loanProfileData.forEach((row, rowIndex) => {
        profileSheet.cell(rowIndex + 1, 1).string(row[0]).style(headerStyle);
        const value = row[1];
        if (typeof value === 'number') {
          profileSheet.cell(rowIndex + 1, 2).number(value).style(numberStyle);
        } else {
          profileSheet.cell(rowIndex + 1, 2).string(value ? value.toString() : '').style(cellStyle);
        }
      });

      profileSheet.column(1).setWidth(25);
      profileSheet.column(2).setWidth(30);

      // Add schedule sheet if available
      if (schedule && schedule.length > 0) {
        const scheduleSheet = workbook.addWorksheet('Payment Schedule');
        
        // Schedule headers
        const scheduleHeaders = ['S.No.', 'Due Date', 'Opening Balance', 'Principal', 'Interest', 'Closing Balance', 'Monthly Savings', 'Total Payment', 'Status'];
        
        scheduleHeaders.forEach((header, index) => {
          scheduleSheet.cell(1, index + 1).string(header).style(headerStyle);
          scheduleSheet.column(index + 1).setWidth(15);
        });

        // Schedule data
        schedule.forEach((row, rowIndex) => {
          scheduleSheet.cell(rowIndex + 2, 1).number(row.installment_number || rowIndex + 1).style(cellStyle);
          scheduleSheet.cell(rowIndex + 2, 2).string(row.due_date || '').style(cellStyle);
          scheduleSheet.cell(rowIndex + 2, 3).number(parseFloat(row.opening_balance || 0)).style(numberStyle);
          scheduleSheet.cell(rowIndex + 2, 4).number(parseFloat(row.principal_amount || 0)).style(numberStyle);
          scheduleSheet.cell(rowIndex + 2, 5).number(parseFloat(row.interest_amount || 0)).style(numberStyle);
          scheduleSheet.cell(rowIndex + 2, 6).number(parseFloat(row.closing_balance || 0)).style(numberStyle);
          scheduleSheet.cell(rowIndex + 2, 7).number(parseFloat(row.monthly_savings || 0)).style(numberStyle);
          scheduleSheet.cell(rowIndex + 2, 8).number(parseFloat(row.total_installment || 0)).style(numberStyle);
          scheduleSheet.cell(rowIndex + 2, 9).string(row.payment_status || 'PENDING').style(cellStyle);
        });
      }

      const filename = `loan_${loan.loan_number}_export.xlsx`;

      // Write to buffer
      workbook.writeToBuffer().then(buffer => {
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(buffer);
      }).catch(err => {
        console.error('Error generating Excel file:', err);
        res.status(500).json({
          success: false,
          message: 'Failed to generate Excel file',
          error: err.message
        });
      });

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

      // For import, we can use a different library or convert the excel4node workbook
      // For now, let's use the existing XLSX library for reading files
      const XLSX = require('xlsx');
      
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