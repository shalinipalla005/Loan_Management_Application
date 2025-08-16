const express = require('express');
const router = express.Router();
const memberController = require('../controllers/memberController');
const { requireOfficer, forbidClientCreate } = require('../middleware/auth');

// GET /api/members
router.get('/', requireOfficer, memberController.listMembers);

// GET /api/members/:id
router.get('/:id', requireOfficer, memberController.getMemberById);

// POST /api/members
router.post('/', requireOfficer, forbidClientCreate, memberController.createMember);

// PUT /api/members/:id
router.put('/:id', requireOfficer, forbidClientCreate, memberController.updateMember);

// DELETE /api/members/:id
router.delete('/:id', requireOfficer, forbidClientCreate, memberController.deleteMember);

module.exports = router; 