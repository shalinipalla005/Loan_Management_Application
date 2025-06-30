const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Penalty = sequelize.define('Penalty', {
  penalty_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  loan_id: { type: DataTypes.INTEGER, allowNull: false },
  schedule_id: { type: DataTypes.INTEGER },
  penalty_type: { type: DataTypes.ENUM('LATE_PAYMENT', 'PROCESSING_FEE', 'OTHER'), allowNull: false },
  penalty_amount: { type: DataTypes.DECIMAL(10,2), allowNull: false },
  penalty_date: { type: DataTypes.DATE, allowNull: false },
  due_date: { type: DataTypes.DATE, allowNull: false },
  status: { type: DataTypes.ENUM('PENDING', 'PAID', 'WAIVED'), defaultValue: 'PENDING' },
  waived_by: { type: DataTypes.INTEGER },
  waived_date: { type: DataTypes.DATE },
  waived_reason: { type: DataTypes.STRING },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  tableName: 'penalties',
  timestamps: false,
});

module.exports = Penalty; 