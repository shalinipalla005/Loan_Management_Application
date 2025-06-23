const express = require('express');
const router = express.Router();
const memberController = require('../controllers/memberController');

// GET /api/members
router.get('/', memberController.listMembers);

// GET /api/members/:id
router.get('/:id', memberController.getMemberById);

module.exports = router; 