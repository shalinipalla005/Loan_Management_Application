const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const LoanStatusHistory = sequelize.define('LoanStatusHistory', {
  history_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  loan_id: { type: DataTypes.INTEGER, allowNull: false },
  old_status: { type: DataTypes.STRING },
  new_status: { type: DataTypes.STRING, allowNull: false },
  changed_by: { type: DataTypes.INTEGER },
  change_reason: { type: DataTypes.STRING },
  changed_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  tableName: 'loan_status_history',
  timestamps: false,
});

module.exports = LoanStatusHistory; 