'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('loan_officers', 'password', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'changeme' // Temporary, will update for admin seed
    });
    await queryInterface.addColumn('loan_officers', 'role', {
      type: Sequelize.ENUM('admin', 'officer', 'auditor'),
      allowNull: false,
      defaultValue: 'officer'
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('loan_officers', 'password');
    await queryInterface.removeColumn('loan_officers', 'role');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_loan_officers_role";');
  }
}; 