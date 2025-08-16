const express = require('express');
const router = express.Router();
const DashboardController = require('../controllers/dashboardController');
const { requireOfficer } = require('../middleware/auth');

router.get('/dashboard/interest', requireOfficer, DashboardController.getInterestDashboard);
router.get('/dashboard/interest/:borrowerId', requireOfficer, DashboardController.getBorrowerInterestSummary);

module.exports = router;