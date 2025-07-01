const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { requireAdmin } = require('../middleware/auth');

// Officer login (by employee_id or email)
router.post('/login', authController.login);
// Officer register (admin only)
router.post('/register', requireAdmin, authController.register);

module.exports = router; 