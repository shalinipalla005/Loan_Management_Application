const sequelize = require('../config/database');
const Member = require('./Member');
const Loan = require('./Loan');
const Society = require('./Society');
const LoanOfficer = require('./LoanOfficer');
const LoanProduct = require('./LoanProduct');

// Associations
Member.belongsTo(Society, { foreignKey: 'society_id' });
Loan.belongsTo(Member, { foreignKey: 'member_id' });
Loan.belongsTo(Society, { foreignKey: 'society_id' });
Loan.belongsTo(LoanOfficer, { foreignKey: 'officer_id' });
Loan.belongsTo(LoanProduct, { foreignKey: 'product_id' });
LoanOfficer.belongsTo(Society, { foreignKey: 'society_id' });
LoanProduct.belongsTo(Society, { foreignKey: 'society_id' });

module.exports = {
  sequelize,
  Member,
  Loan,
  Society,
  LoanOfficer,
  LoanProduct,
}; 