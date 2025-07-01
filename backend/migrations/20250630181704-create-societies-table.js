'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('societies', {
      society_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      society_name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      registration_number: {
        type: Sequelize.STRING,
        unique: true
      },
      address: {
        type: Sequelize.STRING
      },
      contact_number: {
        type: Sequelize.STRING
      },
      email: {
        type: Sequelize.STRING
      },
      established_date: {
        type: Sequelize.DATE
      },
      status: {
        type: Sequelize.ENUM('ACTIVE', 'INACTIVE'),
        defaultValue: 'ACTIVE'
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
    await queryInterface.dropTable('societies');
  }
};
