"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('penalties', {
      penalty_id: {
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
      penalty_type: {
        type: Sequelize.ENUM('LATE_PAYMENT', 'PROCESSING_FEE', 'OTHER'),
        allowNull: false
      },
      penalty_amount: {
        type: Sequelize.DECIMAL(10,2),
        allowNull: false
      },
      penalty_date: {
        type: Sequelize.DATE,
        allowNull: false
      },
      due_date: {
        type: Sequelize.DATE,
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('PENDING', 'PAID', 'WAIVED'),
        defaultValue: 'PENDING'
      },
      waived_by: {
        type: Sequelize.INTEGER,
        references: {
          model: 'loan_officers',
          key: 'officer_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        allowNull: true
      },
      waived_date: {
        type: Sequelize.DATE
      },
      waived_reason: {
        type: Sequelize.STRING
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('penalties');
  }
};
