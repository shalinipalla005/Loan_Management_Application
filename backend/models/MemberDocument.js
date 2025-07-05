const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const MemberDocument = sequelize.define('MemberDocument', {
  document_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  member_id: { type: DataTypes.INTEGER, allowNull: false },
  document_type: { type: DataTypes.ENUM('AADHAAR', 'PAN', 'PHOTO', 'CHEQUE_LEAF', 'OTHER'), allowNull: false },
  document_name: { type: DataTypes.STRING, allowNull: false },
  file_path: { type: DataTypes.STRING },
  upload_date: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  uploaded_by: { type: DataTypes.INTEGER },
  status: { type: DataTypes.ENUM('ACTIVE', 'INACTIVE', 'EXPIRED'), defaultValue: 'ACTIVE' },
}, {
  tableName: 'member_documents',
  timestamps: false,
});

module.exports = MemberDocument; 