const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const LoanOfficer = sequelize.define('LoanOfficer', {
  officer_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  officer_name: { type: DataTypes.STRING, allowNull: false },
  employee_id: { type: DataTypes.STRING, unique: true, allowNull: false },
  society_id: { type: DataTypes.INTEGER },
  contact_number: { type: DataTypes.STRING },
  email: { type: DataTypes.STRING, unique: true },
  password: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.ENUM('admin', 'officer', 'auditor'), defaultValue: 'officer' },
  designation: { type: DataTypes.STRING },
  hire_date: { type: DataTypes.DATE },
  status: { type: DataTypes.STRING, defaultValue: 'ACTIVE' },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  tableName: 'loan_officers',
  timestamps: false,
});

module.exports = LoanOfficer; 