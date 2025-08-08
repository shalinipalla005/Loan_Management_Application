const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Payment = sequelize.define('Payment', {
  payment_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  loan_id: { type: DataTypes.INTEGER, allowNull: false },
  schedule_id: { type: DataTypes.INTEGER },
  member_id: { type: DataTypes.INTEGER, allowNull: false },
  payment_date: { type: DataTypes.DATE, allowNull: false },
  payment_amount: { type: DataTypes.DECIMAL(12,2), allowNull: false },
  principal_paid: { type: DataTypes.DECIMAL(12,2), defaultValue: 0.00 },
  interest_paid: { type: DataTypes.DECIMAL(12,2), defaultValue: 0.00 },
  savings_paid: { type: DataTypes.DECIMAL(10,2), defaultValue: 0.00 },
  penalty_paid: { type: DataTypes.DECIMAL(10,2), defaultValue: 0.00 },
  payment_method: { type: DataTypes.ENUM('CASH', 'CHEQUE', 'BANK_TRANSFER', 'UPI', 'NEFT', 'RTGS'), defaultValue: 'CASH' },
  transaction_reference: { type: DataTypes.STRING },
  receipt_number: { type: DataTypes.STRING, unique: true },
  processed_by: { type: DataTypes.INTEGER },
  remarks: { type: DataTypes.STRING },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  tableName: 'payments',
  timestamps: false,
});

module.exports = Payment; 