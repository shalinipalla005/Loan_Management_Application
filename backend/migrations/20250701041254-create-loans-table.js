'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('loans', {
      loan_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      loan_number: {
        type: Sequelize.STRING,
        unique: true,
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
      society_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'societies',
          key: 'society_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      officer_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'loan_officers',
          key: 'officer_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      product_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'loan_products',
          key: 'product_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      loan_amount: {
        type: Sequelize.DECIMAL(12,2),
        allowNull: false
      },
      interest_rate: {
        type: Sequelize.DECIMAL(5,2),
        allowNull: false
      },
      tenure_months: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      processing_fee: {
        type: Sequelize.DECIMAL(10,2)
      },
      monthly_savings: {
        type: Sequelize.DECIMAL(10,2),
        defaultValue: 200.00
      },
      disbursement_date: {
        type: Sequelize.DATE
      },
      first_due_date: {
        type: Sequelize.DATE
      },
      last_due_date: {
        type: Sequelize.DATE
      },
      total_interest: {
        type: Sequelize.DECIMAL(12,2)
      },
      total_payable: {
        type: Sequelize.DECIMAL(12,2)
      },
      outstanding_principal: {
        type: Sequelize.DECIMAL(12,2)
      },
      outstanding_interest: {
        type: Sequelize.DECIMAL(12,2)
      },
      loan_status: {
        type: Sequelize.STRING,
        defaultValue: 'PENDING'
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('loans');
  }
};
