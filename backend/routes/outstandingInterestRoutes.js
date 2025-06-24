const express = require('express');
const router = express.Router();
const interestController = require('../controllers/interestController');

// GET /api/loans/outstanding
router.get('/outstanding', interestController.getLoansWithOutstandingInterest);

// GET /api/loans/outstanding/:loanId
router.get('/:loanId/outstanding', interestController.getLoansWithOutstandingInterestById);

module.exports = router;
