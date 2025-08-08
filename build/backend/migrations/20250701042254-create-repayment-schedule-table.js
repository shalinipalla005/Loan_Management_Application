'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('repayment_schedule', {
      schedule_id: {
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
      installment_number: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      due_date: {
        type: Sequelize.DATE,
        allowNull: false
      },
      opening_balance: {
        type: Sequelize.DECIMAL(12,2),
        allowNull: false
      },
      principal_amount: {
        type: Sequelize.DECIMAL(12,2),
        allowNull: false
      },
      interest_amount: {
        type: Sequelize.DECIMAL(12,2),
        allowNull: false
      },
      monthly_savings: {
        type: Sequelize.DECIMAL(10,2),
        allowNull: false
      },
      total_installment: {
        type: Sequelize.DECIMAL(12,2),
        allowNull: false
      },
      closing_balance: {
        type: Sequelize.DECIMAL(12,2),
        allowNull: false
      },
      payment_status: {
        type: Sequelize.ENUM('PENDING', 'PAID', 'PARTIAL', 'OVERDUE', 'DEFAULTED'),
        defaultValue: 'PENDING'
      },
      paid_date: {
        type: Sequelize.DATE
      },
      paid_amount: {
        type: Sequelize.DECIMAL(12,2),
        defaultValue: 0.00
      },
      penalty_applied: {
        type: Sequelize.DECIMAL(10,2),
        defaultValue: 0.00
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add unique index on loan_id and installment_number
    await queryInterface.addIndex('repayment_schedule', ['loan_id', 'installment_number'], {
      unique: true,
      name: 'repayment_schedule_loan_installment_unique'
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('repayment_schedule');
  }
};
