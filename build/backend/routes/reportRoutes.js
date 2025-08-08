const express = require('express');
const router = express.Router();
const controller = require('../controllers/reportController');

router.get('/loan-summary', controller.loanSummary);
router.get('/overdue-loans', controller.overdueLoans);
router.get('/monthly-collections', controller.monthlyCollections);

module.exports = router; 