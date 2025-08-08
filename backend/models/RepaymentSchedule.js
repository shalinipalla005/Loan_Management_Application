const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const RepaymentSchedule = sequelize.define('RepaymentSchedule', {
  schedule_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  loan_id: { type: DataTypes.INTEGER, allowNull: false },
  installment_number: { type: DataTypes.INTEGER, allowNull: false },
  due_date: { type: DataTypes.DATE, allowNull: false },
  opening_balance: { type: DataTypes.DECIMAL(12,2), allowNull: false },
  principal_amount: { type: DataTypes.DECIMAL(12,2), allowNull: false },
  interest_amount: { type: DataTypes.DECIMAL(12,2), allowNull: false },
  monthly_savings: { type: DataTypes.DECIMAL(10,2), allowNull: false },
  total_installment: { type: DataTypes.DECIMAL(12,2), allowNull: false },
  closing_balance: { type: DataTypes.DECIMAL(12,2), allowNull: false },
  payment_status: { type: DataTypes.ENUM('PENDING', 'PAID', 'PARTIAL', 'OVERDUE', 'DEFAULTED'), defaultValue: 'PENDING' },
  paid_date: { type: DataTypes.DATE },
  paid_amount: { type: DataTypes.DECIMAL(12,2), defaultValue: 0.00 },
  penalty_applied: { type: DataTypes.DECIMAL(10,2), defaultValue: 0.00 },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  tableName: 'repayment_schedule',
  timestamps: false,
  indexes: [
    { unique: true, fields: ['loan_id', 'installment_number'] }
  ]
});

module.exports = RepaymentSchedule; 