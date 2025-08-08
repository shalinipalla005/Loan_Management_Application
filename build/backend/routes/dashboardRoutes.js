const express = require('express');
const router = express.Router();
const DashboardController = require('../controllers/dashboardController');

router.get('/dashboard/interest', DashboardController.getInterestDashboard);
router.get('/dashboard/interest/:borrowerId', DashboardController.getBorrowerInterestSummary);

module.exports = router;