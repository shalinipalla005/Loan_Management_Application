const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AuditLog = sequelize.define('AuditLog', {
  log_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  table_name: { type: DataTypes.STRING, allowNull: false },
  record_id: { type: DataTypes.INTEGER },
  action: { type: DataTypes.ENUM('INSERT', 'UPDATE', 'DELETE'), allowNull: false },
  old_values: { type: DataTypes.TEXT },
  new_values: { type: DataTypes.TEXT },
  user_id: { type: DataTypes.INTEGER },
  timestamp: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  ip_address: { type: DataTypes.STRING },
}, {
  tableName: 'audit_log',
  timestamps: false,
});

module.exports = AuditLog; 