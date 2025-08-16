'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // For dialects that support ENUM alter, change column
    try {
      await queryInterface.changeColumn('loan_officers', 'role', {
        type: Sequelize.ENUM('admin', 'officer', 'auditor', 'client'),
        allowNull: false,
        defaultValue: 'officer'
      });
    } catch (err) {
      // sqlite may not support altering ENUM; ignore
      console.warn('Skipping ENUM alter for role (may be unsupported on this dialect):', err.message);
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      await queryInterface.changeColumn('loan_officers', 'role', {
        type: Sequelize.ENUM('admin', 'officer', 'auditor'),
        allowNull: false,
        defaultValue: 'officer'
      });
    } catch (err) {
      console.warn('Skipping ENUM revert for role:', err.message);
    }
  }
};


