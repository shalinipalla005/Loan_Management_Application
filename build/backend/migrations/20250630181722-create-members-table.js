'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('members', {
      member_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      member_name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      membership_number: {
        type: Sequelize.STRING,
        unique: true,
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
      aadhaar_number: {
        type: Sequelize.STRING,
        unique: true
      },
      pan_number: {
        type: Sequelize.STRING,
        unique: true
      },
      contact_number: {
        type: Sequelize.STRING
      },
      email: {
        type: Sequelize.STRING
      },
      address: {
        type: Sequelize.STRING
      },
      date_of_birth: {
        type: Sequelize.DATE
      },
      membership_date: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      membership_fee: {
        type: Sequelize.DECIMAL(10,2),
        defaultValue: 50.00
      },
      share_capital: {
        type: Sequelize.DECIMAL(10,2),
        defaultValue: 1000.00
      },
      status: {
        type: Sequelize.STRING,
        defaultValue: 'ACTIVE'
      },
      password: {
        type: Sequelize.STRING,
        allowNull: true
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
    await queryInterface.dropTable('members');
  }
};
