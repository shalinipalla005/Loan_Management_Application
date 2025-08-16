const express = require('express');
const router = express.Router();
const controller = require('../controllers/loanProductController');
const { requireOfficer, forbidClientCreate } = require('../middleware/auth');

router.get('/', requireOfficer, controller.list);
router.get('/:id', requireOfficer, controller.get);
router.post('/', requireOfficer, forbidClientCreate, controller.create);
router.put('/:id', requireOfficer, forbidClientCreate, controller.update);
router.delete('/:id', requireOfficer, forbidClientCreate, controller.delete);

module.exports = router; 