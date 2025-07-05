const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Member = sequelize.define('Member', {
  member_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  member_name: { type: DataTypes.STRING, allowNull: false },
  membership_number: { type: DataTypes.STRING, unique: true, allowNull: false },
  society_id: { type: DataTypes.INTEGER, allowNull: false },
  aadhaar_number: { type: DataTypes.STRING, unique: true },
  pan_number: { type: DataTypes.STRING, unique: true },
  contact_number: { type: DataTypes.STRING },
  email: { type: DataTypes.STRING },
  address: { type: DataTypes.STRING },
  date_of_birth: { type: DataTypes.DATE },
  membership_date: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  membership_fee: { type: DataTypes.DECIMAL(10,2), defaultValue: 50.00 },
  share_capital: { type: DataTypes.DECIMAL(10,2), defaultValue: 1000.00 },
  status: { type: DataTypes.STRING, defaultValue: 'ACTIVE' },
  password: { type: DataTypes.STRING, allowNull: true },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  tableName: 'members',
  timestamps: false,
});

module.exports = Member; 