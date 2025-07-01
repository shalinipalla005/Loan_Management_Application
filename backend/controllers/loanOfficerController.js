const { LoanOfficer } = require('../models');
const IDGenerator = require('../utils/idGenerator');

exports.list = async (req, res) => {
  try {
    const officers = await LoanOfficer.findAll({
      order: [['created_at', 'DESC']]
    });
    res.json(officers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.get = async (req, res) => {
  try {
    const officer = await LoanOfficer.findByPk(req.params.id);
    if (!officer) return res.status(404).json({ error: 'Officer not found' });
    res.json(officer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    // Auto-generate employee ID if not provided
    if (!req.body.employee_id) {
      req.body.employee_id = await IDGenerator.generateEmployeeId();
    }
    
    // Set default values
    req.body.status = req.body.status || 'ACTIVE';
    req.body.hire_date = req.body.hire_date || new Date();
    req.body.society_id = req.body.society_id || 1; // Default to first society
    
    const officer = await LoanOfficer.create(req.body, { user: req.officer });
    res.status(201).json(officer);
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      res.status(400).json({ error: 'Employee ID already exists' });
    } else {
      res.status(400).json({ error: err.message });
    }
  }
};

exports.update = async (req, res) => {
  try {
    const officer = await LoanOfficer.findByPk(req.params.id);
    if (!officer) return res.status(404).json({ error: 'Officer not found' });
    await officer.update(req.body, { user: req.officer });
    res.json(officer);
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      res.status(400).json({ error: 'Employee ID already exists' });
    } else {
      res.status(400).json({ error: err.message });
    }
  }
};

exports.delete = async (req, res) => {
  try {
    const officer = await LoanOfficer.findByPk(req.params.id);
    if (!officer) return res.status(404).json({ error: 'Officer not found' });
    await officer.destroy({ user: req.officer });
    res.json({ message: 'Officer deleted successfully' });
  } catch (err) {
    if (err.name === 'SequelizeForeignKeyConstraintError') {
      res.status(400).json({ error: 'Cannot delete officer with existing loans' });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
}; 