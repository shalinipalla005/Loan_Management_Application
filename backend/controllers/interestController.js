const Loan = require('../models/Loan');
const { Op } = require("sequelize");

async function getLoansWithOutstandingInterest(req, res) {
  const page = parseInt(req.query.page) || 1;
  const limit = 20; 
  const offset = (page - 1) * limit;
  
  try {
    const { count, rows: loans } = await Loan.findAndCountAll({
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
      },
      limit,
      offset,
      order: [["outstanding_interest", "DESC"]] 
    });
    
    res.json({
      currentPage: page,
      totalPages: Math.ceil(count / limit),
      totalRecords: count,
      data: loans
    });
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
