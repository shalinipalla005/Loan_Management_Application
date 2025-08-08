const express = require('express');
const router = express.Router();
const memberController = require('../controllers/memberController');

// GET /api/members
router.get('/', memberController.listMembers);

// GET /api/members/:id
router.get('/:id', memberController.getMemberById);

// POST /api/members
router.post('/', memberController.createMember);

// PUT /api/members/:id
router.put('/:id', memberController.updateMember);

// DELETE /api/members/:id
router.delete('/:id', memberController.deleteMember);

module.exports = router; 