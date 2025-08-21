const express = require('express');
const router = express.Router();
const controller = require('../controllers/loanController');
const { requireOfficer, forbidClientCreate } = require('../middleware/auth');

router.get('/', requireOfficer, controller.list);
router.get('/:id', requireOfficer, controller.get);
router.post('/', requireOfficer, forbidClientCreate, controller.create);
router.put('/:id', requireOfficer, forbidClientCreate, controller.update);
router.delete('/:id', requireOfficer, forbidClientCreate, controller.delete);
router.patch('/:id/clear', requireOfficer, controller.clearLoan);
router.get('/:id/dues', requireOfficer, controller.getLoanDues);
router.get('/:id/savings', requireOfficer, controller.getLoanSavings);
router.post('/:id/disburse', requireOfficer, forbidClientCreate, controller.disburseLoan);
router.post('/:id/approve', requireOfficer, forbidClientCreate, controller.approveLoan);

module.exports = router;