const express = require('express');
const router = express.Router();
const loanController = require('../controllers/loanprofileController');
const { requireOfficer, forbidClientCreate } = require('../middleware/auth');

// GET /api/loans/members - Fetch all members with their associated loans
router.get('/members', requireOfficer, loanController.getMembersWithLoans);

// GET /api/loans/members/:memberId - Fetch specific member with their loans
router.get('/members/:memberId', requireOfficer, loanController.getMemberWithLoans);

// GET /api/loans - List all loan profiles with member details
router.get('/', requireOfficer, loanController.getAllLoans);

// POST /api/loans - Add a new loan
router.post('/', requireOfficer, forbidClientCreate, loanController.createLoan);

// GET /api/loans/:loanId - Get a specific loan profile
router.get('/:loanId', requireOfficer, loanController.getLoanById);

// PUT /api/loans/:loanId - Update a loan profile (for payments and all)
router.put('/:loanId', requireOfficer, forbidClientCreate, loanController.updateLoan);

// DELETE /api/loans/:loanId - Delete a loan profile
router.delete('/:loanId', requireOfficer, forbidClientCreate, loanController.deleteLoan);

module.exports = router;