const Loan = require('../models/Loan');
const { Op } = require("sequelize");

async function getLoansWithOutstandingInterest(req, res) {
  try {
    const loans = await Loan.findAll({
      attributes: [
        "loan_id",
        "loan_number",
        "member_id",
        "society_id",
        "officer_id",
        "product_id",
        "interest_rate",
        "total_interest",
        "outstanding_principal",
        "outstanding_interest"
      ],
      where: {
        outstanding_interest: {
          [Op.gt]: 0
        }
      }
    });
    res.json(loans);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getLoansWithOutstandingInterestById(req, res) {
  const { loanId } = req.params;
  try {
    const loan = await Loan.findOne({
      attributes: [
        "loan_id",
        "loan_number",
        "member_id",
        "society_id",
        "officer_id",
        "product_id",
        "interest_rate",
        "total_interest",
        "outstanding_principal",
        "outstanding_interest"
      ],
      where: {
        loan_id: loanId,
        outstanding_interest: {
          [Op.gt]: 0
        }
      }
    });

    if (!loan) {
      return res.status(404).json({ error: 'Loan not found or no outstanding interest' });
    }

    res.json(loan);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  getLoansWithOutstandingInterest,
  getLoansWithOutstandingInterestById
};
