const { sequelize } = require('../models');
const { Society, Member, LoanOfficer, LoanProduct, Loan, Payment } = require('../models');

// ID Generator utility class
class IDGenerator {
  static async generateSocietyId() {
    const today = new Date();
    const dateStr = today.getFullYear().toString().slice(-2) + 
                   (today.getMonth() + 1).toString().padStart(2, '0') + 
                   today.getDate().toString().padStart(2, '0');
    
    const lastSociety = await Society.findOne({
      where: {
        registration_number: {
          [require('sequelize').Op.like]: `SSA${dateStr}%`
        }
      },
      order: [['registration_number', 'DESC']]
    });

    let counter = 1;
    if (lastSociety) {
      const lastCounter = parseInt(lastSociety.registration_number.slice(-3));
      counter = lastCounter + 1;
    }

    return `SSA${dateStr}${counter.toString().padStart(3, '0')}`;
  }

  static async generateMemberId() {
    const today = new Date();
    const dateStr = today.getFullYear().toString() + 
                   (today.getMonth() + 1).toString().padStart(2, '0') + 
                   today.getDate().toString().padStart(2, '0');
    
    const lastMember = await Member.findOne({
      where: {
        membership_number: {
          [require('sequelize').Op.like]: `MEM${dateStr}%`
        }
      },
      order: [['membership_number', 'DESC']]
    });

    let counter = 1;
    if (lastMember) {
      const lastCounter = parseInt(lastMember.membership_number.slice(-3));
      counter = lastCounter + 1;
    }

    return `MEM${dateStr}${counter.toString().padStart(3, '0')}`;
  }

  static async generateEmployeeId() {
    const today = new Date();
    const dateStr = today.getFullYear().toString() + 
                   (today.getMonth() + 1).toString().padStart(2, '0') + 
                   today.getDate().toString().padStart(2, '0');
    
    const lastOfficer = await LoanOfficer.findOne({
      where: {
        employee_id: {
          [require('sequelize').Op.like]: `EMP${dateStr}%`
        }
      },
      order: [['employee_id', 'DESC']]
    });

    let counter = 1;
    if (lastOfficer) {
      const lastCounter = parseInt(lastOfficer.employee_id.slice(-3));
      counter = lastCounter + 1;
    }

    return `EMP${dateStr}${counter.toString().padStart(3, '0')}`;
  }

  static async generateProductName() {
    const lastProduct = await LoanProduct.findOne({
      order: [['product_id', 'DESC']]
    });

    let counter = 1;
    if (lastProduct) {
      const lastCounter = parseInt(lastProduct.product_id);
      counter = lastCounter + 1;
    }

    return `Product ${counter.toString().padStart(3, '0')}`;
  }

  static async generateLoanId() {
    const today = new Date();
    const dateStr = today.getFullYear().toString() + 
                   (today.getMonth() + 1).toString().padStart(2, '0') + 
                   today.getDate().toString().padStart(2, '0');
    
    const lastLoan = await Loan.findOne({
      where: {
        loan_number: {
          [require('sequelize').Op.like]: `LOAN${dateStr}%`
        }
      },
      order: [['loan_number', 'DESC']]
    });

    let counter = 1;
    if (lastLoan) {
      const lastCounter = parseInt(lastLoan.loan_number.slice(-3));
      counter = lastCounter + 1;
    }

    return `LOAN${dateStr}${counter.toString().padStart(3, '0')}`;
  }

  static async generateReceiptNumber() {
    const today = new Date();
    const dateStr = today.getFullYear().toString() + 
                   (today.getMonth() + 1).toString().padStart(2, '0') + 
                   today.getDate().toString().padStart(2, '0');
    
    const lastPayment = await Payment.findOne({
      where: {
        receipt_number: {
          [require('sequelize').Op.like]: `RCPT${dateStr}%`
        }
      },
      order: [['receipt_number', 'DESC']]
    });

    let counter = 1;
    if (lastPayment) {
      const lastCounter = parseInt(lastPayment.receipt_number.slice(-3));
      counter = lastCounter + 1;
    }

    return `RCPT${dateStr}${counter.toString().padStart(3, '0')}`;
  }
}

module.exports = IDGenerator; 