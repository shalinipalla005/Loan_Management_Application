'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('loan_products', {
      product_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      product_name: {
        type: Sequelize.STRING,
        allowNull: false
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
      interest_rate: {
        type: Sequelize.DECIMAL(5,2),
        allowNull: false
      },
      processing_fee_rate: {
        type: Sequelize.DECIMAL(5,2),
        defaultValue: 1.00
      },
      min_amount: {
        type: Sequelize.DECIMAL(12,2)
      },
      max_amount: {
        type: Sequelize.DECIMAL(12,2)
      },
      min_tenure_months: {
        type: Sequelize.INTEGER
      },
      max_tenure_months: {
        type: Sequelize.INTEGER
      },
      monthly_savings_required: {
        type: Sequelize.DECIMAL(10,2),
        defaultValue: 200.00
      },
      savings_interest_rate: {
        type: Sequelize.DECIMAL(5,2),
        defaultValue: 6.00
      },
      penalty_amount: {
        type: Sequelize.DECIMAL(10,2),
        defaultValue: 1000.00
      },
      status: {
        type: Sequelize.STRING,
        defaultValue: 'ACTIVE'
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('loan_products');
  }
};
