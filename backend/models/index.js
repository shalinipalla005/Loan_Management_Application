const sequelize = require('../config/database');
const Member = require('./Member');
const Loan = require('./Loan');
const Society = require('./Society');
const LoanOfficer = require('./LoanOfficer');
const LoanProduct = require('./LoanProduct');
const RepaymentSchedule = require('./RepaymentSchedule');
const Payment = require('./Payment');
const MemberSavings = require('./MemberSavings');
const Penalty = require('./Penalty');
const LoanStatusHistory = require('./LoanStatusHistory');
const MemberDocument = require('./MemberDocument');
const AuditLog = require('./AuditLog');

// Associations
Member.belongsTo(Society, { foreignKey: 'society_id' });
Loan.belongsTo(Member, { foreignKey: 'member_id' });
Member.hasMany(Loan, { foreignKey: 'member_id' });
Loan.belongsTo(Society, { foreignKey: 'society_id' });
Loan.belongsTo(LoanOfficer, { foreignKey: 'officer_id' });
Loan.belongsTo(LoanProduct, { foreignKey: 'product_id' });
LoanOfficer.belongsTo(Society, { foreignKey: 'society_id' });
LoanProduct.belongsTo(Society, { foreignKey: 'society_id' });
RepaymentSchedule.belongsTo(Loan, { foreignKey: 'loan_id' });
Payment.belongsTo(Loan, { foreignKey: 'loan_id' });
Payment.belongsTo(RepaymentSchedule, { foreignKey: 'schedule_id' });
Payment.belongsTo(Member, { foreignKey: 'member_id' });
Payment.belongsTo(LoanOfficer, { foreignKey: 'processed_by' });
MemberSavings.belongsTo(Member, { foreignKey: 'member_id' });
MemberSavings.belongsTo(Loan, { foreignKey: 'loan_id' });
MemberSavings.belongsTo(LoanOfficer, { foreignKey: 'processed_by' });
Penalty.belongsTo(Loan, { foreignKey: 'loan_id' });
Penalty.belongsTo(RepaymentSchedule, { foreignKey: 'schedule_id' });
Penalty.belongsTo(LoanOfficer, { foreignKey: 'waived_by' });
LoanStatusHistory.belongsTo(Loan, { foreignKey: 'loan_id' });
LoanStatusHistory.belongsTo(LoanOfficer, { foreignKey: 'changed_by' });
MemberDocument.belongsTo(Member, { foreignKey: 'member_id' });
MemberDocument.belongsTo(LoanOfficer, { foreignKey: 'uploaded_by' });
AuditLog.belongsTo(LoanOfficer, { foreignKey: 'user_id' });

const getUserIdFromOptions = (options) => (options && options.user && options.user.member_id) ? options.user.member_id : null;
const getIpFromOptions = (options) => (options && options.ip) ? options.ip : null;

function addAuditHooks(model, modelName) {
  model.addHook('afterCreate', async (instance, options) => {
    try {
      await AuditLog.create({
        table_name: modelName,
        record_id: instance[model.primaryKeyAttribute],
        action: 'INSERT',
        old_values: null,
        new_values: JSON.stringify(instance.toJSON()),
        user_id: getUserIdFromOptions(options),
        ip_address: getIpFromOptions(options)
      });
    } catch (err) { console.error('AuditLog afterCreate error:', err); }
  });
  model.addHook('afterUpdate', async (instance, options) => {
    try {
      await AuditLog.create({
        table_name: modelName,
        record_id: instance[model.primaryKeyAttribute],
        action: 'UPDATE',
        old_values: JSON.stringify(options.beforeUpdateValues || {}),
        new_values: JSON.stringify(instance.toJSON()),
        user_id: getUserIdFromOptions(options),
        ip_address: getIpFromOptions(options)
      });
    } catch (err) { console.error('AuditLog afterUpdate error:', err); }
  });
  model.addHook('beforeUpdate', (instance, options) => {
    // Store old values for audit
    options.beforeUpdateValues = { ...instance._previousDataValues };
  });
  model.addHook('afterDestroy', async (instance, options) => {
    try {
      await AuditLog.create({
        table_name: modelName,
        record_id: instance[model.primaryKeyAttribute],
        action: 'DELETE',
        old_values: JSON.stringify(instance.toJSON()),
        new_values: null,
        user_id: getUserIdFromOptions(options),
        ip_address: getIpFromOptions(options)
      });
    } catch (err) { console.error('AuditLog afterDestroy error:', err); }
  });
}

// Add audit hooks to all models except AuditLog itself
[
  Member, Loan, Society, LoanOfficer, LoanProduct, RepaymentSchedule, Payment, MemberSavings, Penalty, LoanStatusHistory, MemberDocument
].forEach(model => addAuditHooks(model, model.tableName));

module.exports = {
  sequelize,
  Member,
  Loan,
  Society,
  LoanOfficer,
  LoanProduct,
  RepaymentSchedule,
  Payment,
  MemberSavings,
  Penalty,
  LoanStatusHistory,
  MemberDocument,
  AuditLog,
};