const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const LoanProduct = sequelize.define('LoanProduct', {
  product_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  product_name: { type: DataTypes.STRING, allowNull: false },
  society_id: { type: DataTypes.INTEGER, allowNull: false },
  interest_rate: { type: DataTypes.DECIMAL(5,2), allowNull: false },
  processing_fee_rate: { type: DataTypes.DECIMAL(5,2), defaultValue: 1.00 },
  min_amount: { type: DataTypes.DECIMAL(12,2) },
  max_amount: { type: DataTypes.DECIMAL(12,2) },
  min_tenure_months: { type: DataTypes.INTEGER },
  max_tenure_months: { type: DataTypes.INTEGER },
  monthly_savings_required: { type: DataTypes.DECIMAL(10,2), defaultValue: 200.00 },
  savings_interest_rate: { type: DataTypes.DECIMAL(5,2), defaultValue: 6.00 },
  penalty_amount: { type: DataTypes.DECIMAL(10,2), defaultValue: 1000.00 },
  status: { type: DataTypes.STRING, defaultValue: 'ACTIVE' },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  tableName: 'loan_products',
  timestamps: false,
});

module.exports = LoanProduct; 