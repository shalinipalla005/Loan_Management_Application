const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Loan = sequelize.define('Loan', {
  loan_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  loan_number: { type: DataTypes.STRING, unique: true, allowNull: false },
  member_id: { type: DataTypes.INTEGER, allowNull: false },
  society_id: { type: DataTypes.INTEGER, allowNull: false },
  officer_id: { type: DataTypes.INTEGER, allowNull: false },
  product_id: { type: DataTypes.INTEGER, allowNull: false },
  loan_amount: { type: DataTypes.DECIMAL(12,2), allowNull: false },
  interest_rate: { type: DataTypes.DECIMAL(5,2), allowNull: false },
  tenure_months: { type: DataTypes.INTEGER, allowNull: false },
  processing_fee: { type: DataTypes.DECIMAL(10,2) },
  monthly_savings: { type: DataTypes.DECIMAL(10,2), defaultValue: 200.00 },
  disbursement_date: { type: DataTypes.DATE },
  first_due_date: { type: DataTypes.DATE },
  last_due_date: { type: DataTypes.DATE },
  total_interest: { type: DataTypes.DECIMAL(12,2) },
  total_payable: { type: DataTypes.DECIMAL(12,2) },
  outstanding_principal: { type: DataTypes.DECIMAL(12,2) },
  outstanding_interest: { type: DataTypes.DECIMAL(12,2) },
  loan_status: { type: DataTypes.STRING, defaultValue: 'PENDING' },
  cleared_by_official: { type: DataTypes.BOOLEAN, defaultValue: false },
  cleared_at: { type: DataTypes.DATE },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  tableName: 'loans',
  timestamps: false,
});

module.exports = Loan; 