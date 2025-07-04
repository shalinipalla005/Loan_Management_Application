const { sequelize } = require('../models');

exports.loanSummary = async (req, res) => {
  const [results] = await sequelize.query('SELECT * FROM loan_summary');
  res.json(results);
};

exports.overdueLoans = async (req, res) => {
  const [results] = await sequelize.query('SELECT * FROM overdue_loans');
  res.json(results);
};

exports.monthlyCollections = async (req, res) => {
  const [results] = await sequelize.query('SELECT * FROM monthly_collections');
  res.json(results);
}; 