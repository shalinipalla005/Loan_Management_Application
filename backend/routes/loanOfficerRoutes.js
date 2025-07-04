const express = require('express');
const router = express.Router();
const controller = require('../controllers/loanOfficerController');
const { requireOfficer, requireAdmin } = require('../middleware/auth');

router.get('/', requireOfficer, controller.list);
router.get('/:id', requireOfficer, controller.get);
router.post('/', requireAdmin, controller.create);
router.put('/:id', requireAdmin, controller.update);
router.delete('/:id', requireAdmin, controller.delete);

module.exports = router; 