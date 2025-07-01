const { Society } = require('../models');
const IDGenerator = require('../utils/idGenerator');

exports.list = async (req, res) => {
  try {
    const societies = await Society.findAll({
      order: [['created_at', 'DESC']]
    });
    res.json(societies);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.get = async (req, res) => {
  try {
    const society = await Society.findByPk(req.params.id);
    if (!society) return res.status(404).json({ error: 'Society not found' });
    res.json(society);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    // Auto-generate registration number if not provided
    if (!req.body.registration_number) {
      req.body.registration_number = await IDGenerator.generateSocietyId();
    }
    
    // Set default values
    req.body.status = req.body.status || 'ACTIVE';
    req.body.established_date = req.body.established_date || new Date();
    
    const society = await Society.create(req.body);
    res.status(201).json(society);
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      res.status(400).json({ error: 'Registration number already exists' });
    } else {
      res.status(400).json({ error: err.message });
    }
  }
};

exports.update = async (req, res) => {
  try {
    const society = await Society.findByPk(req.params.id);
    if (!society) return res.status(404).json({ error: 'Society not found' });
    await society.update(req.body);
    res.json(society);
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      res.status(400).json({ error: 'Registration number already exists' });
    } else {
      res.status(400).json({ error: err.message });
    }
  }
};

exports.delete = async (req, res) => {
  try {
    const society = await Society.findByPk(req.params.id);
    if (!society) return res.status(404).json({ error: 'Society not found' });
    await society.destroy();
    res.json({ message: 'Society deleted successfully' });
  } catch (err) {
    if (err.name === 'SequelizeForeignKeyConstraintError') {
      res.status(400).json({ error: 'Cannot delete society with existing members, loans, or officers' });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
}; 