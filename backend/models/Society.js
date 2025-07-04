const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Society = sequelize.define('Society', {
  society_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  society_name: { type: DataTypes.STRING, allowNull: false },
  registration_number: { type: DataTypes.STRING, unique: true },
  address: { type: DataTypes.STRING },
  contact_number: { type: DataTypes.STRING },
  email: { type: DataTypes.STRING },
  established_date: { type: DataTypes.DATE },

  status: { 
    type: DataTypes.STRING, 
    defaultValue: 'ACTIVE',
    validate: {
      isIn: [['ACTIVE', 'INACTIVE']]
    }
  },

  status: { type: DataTypes.ENUM('ACTIVE', 'INACTIVE'), defaultValue: 'ACTIVE' },

  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  tableName: 'societies',
  timestamps: false,
});


module.exports = Society;

module.exports = Society;

