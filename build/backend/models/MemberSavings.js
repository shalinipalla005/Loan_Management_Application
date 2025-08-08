const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const MemberSavings = sequelize.define('MemberSavings', {
  savings_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  member_id: { type: DataTypes.INTEGER, allowNull: false },
  loan_id: { type: DataTypes.INTEGER },
  transaction_date: { type: DataTypes.DATE, allowNull: false },
  transaction_type: { type: DataTypes.ENUM('DEPOSIT', 'WITHDRAWAL', 'INTEREST_CREDIT') },
  amount: { type: DataTypes.DECIMAL(10,2), allowNull: false },
  balance: { type: DataTypes.DECIMAL(12,2), allowNull: false },
  interest_rate: { type: DataTypes.DECIMAL(5,2), defaultValue: 6.00 },
  description: { type: DataTypes.STRING },
  processed_by: { type: DataTypes.INTEGER },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  tableName: 'member_savings',
  timestamps: false,
});

module.exports = MemberSavings; 