const express = require('express');
const router = express.Router();
const loanController = require('../controllers/loanprofileController');

// GET /api/loans/members - Fetch all members with their associated loans
router.get('/members', loanController.getMembersWithLoans);

// GET /api/loans/members/:memberId - Fetch specific member with their loans
router.get('/members/:memberId', loanController.getMemberWithLoans);

// GET /api/loans - List all loan profiles with member details
router.get('/', loanController.getAllLoans);

// POST /api/loans - Add a new loan
router.post('/', loanController.createLoan);

// GET /api/loans/:loanId - Get a specific loan profile
router.get('/:loanId', loanController.getLoanById);

// PUT /api/loans/:loanId - Update a loan profile (for payments and all)
router.put('/:loanId', loanController.updateLoan);

// DELETE /api/loans/:loanId - Delete a loan profile
router.delete('/:loanId', loanController.deleteLoan);

module.exports = router;