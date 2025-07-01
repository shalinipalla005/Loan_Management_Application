'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('loan_officers', {
      officer_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      officer_name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      employee_id: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: false
      },
      society_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'societies',
          key: 'society_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        allowNull: true
      },
      contact_number: {
        type: Sequelize.STRING
      },
      email: {
        type: Sequelize.STRING,
        unique: true
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false
      },
      role: {
        type: Sequelize.ENUM('admin', 'officer', 'auditor'),
        defaultValue: 'officer',
        allowNull: false
      },
      designation: {
        type: Sequelize.STRING
      },
      hire_date: {
        type: Sequelize.DATE
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
    await queryInterface.dropTable('loan_officers');
  }
};
