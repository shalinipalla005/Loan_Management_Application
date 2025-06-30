const { Society } = require('../models');

exports.list = async (req, res) => {
  const societies = await Society.findAll();
  res.json(societies);
};

exports.get = async (req, res) => {
  const society = await Society.findByPk(req.params.id);
  if (!society) return res.status(404).json({ error: 'Not found' });
  res.json(society);
};

exports.create = async (req, res) => {
  try {
    const society = await Society.create(req.body);
    res.status(201).json(society);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const [count] = await Society.update(req.body, { where: { society_id: req.params.id } });
    if (!count) return res.status(404).json({ error: 'Not found' });
    const updated = await Society.findByPk(req.params.id);
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.delete = async (req, res) => {
  const count = await Society.destroy({ where: { society_id: req.params.id } });
  if (!count) return res.status(404).json({ error: 'Not found' });
  res.json({ success: true });
}; 