'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('member_savings', {
      savings_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
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
      loan_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'loans',
          key: 'loan_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        allowNull: true
      },
      transaction_date: {
        type: Sequelize.DATE,
        allowNull: false
      },
      transaction_type: {
        type: Sequelize.ENUM('DEPOSIT', 'WITHDRAWAL', 'INTEREST_CREDIT')
      },
      amount: {
        type: Sequelize.DECIMAL(10,2),
        allowNull: false
      },
      balance: {
        type: Sequelize.DECIMAL(12,2),
        allowNull: false
      },
      interest_rate: {
        type: Sequelize.DECIMAL(5,2),
        defaultValue: 6.00
      },
      description: {
        type: Sequelize.STRING
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
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('member_savings');
  }
};
