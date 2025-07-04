'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('payments', {
      payment_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      loan_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'loans',
          key: 'loan_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      schedule_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'repayment_schedule',
          key: 'schedule_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        allowNull: true
      },
      member_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'members',
          key: 'member_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      payment_date: {
        type: Sequelize.DATE,
        allowNull: false
      },
      payment_amount: {
        type: Sequelize.DECIMAL(12,2),
        allowNull: false
      },
      principal_paid: {
        type: Sequelize.DECIMAL(12,2),
        defaultValue: 0.00
      },
      interest_paid: {
        type: Sequelize.DECIMAL(12,2),
        defaultValue: 0.00
      },
      savings_paid: {
        type: Sequelize.DECIMAL(10,2),
        defaultValue: 0.00
      },
      penalty_paid: {
        type: Sequelize.DECIMAL(10,2),
        defaultValue: 0.00
      },
      payment_method: {
        type: Sequelize.ENUM('CASH', 'CHEQUE', 'BANK_TRANSFER', 'UPI', 'NEFT', 'RTGS'),
        defaultValue: 'CASH'
      },
      transaction_reference: {
        type: Sequelize.STRING
      },
      receipt_number: {
        type: Sequelize.STRING,
        unique: true
      },
      processed_by: {
        type: Sequelize.INTEGER,
        references: {
          model: 'loan_officers',
          key: 'officer_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        allowNull: true
      },
      remarks: {
        type: Sequelize.STRING
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('payments');
  }
};
