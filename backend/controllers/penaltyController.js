const { Penalty } = require('../models');

exports.list = async (req, res) => {
  const penalties = await Penalty.findAll();
  res.json(penalties);
};

exports.get = async (req, res) => {
  const penalty = await Penalty.findByPk(req.params.id);
  if (!penalty) return res.status(404).json({ error: 'Not found' });
  res.json(penalty);
};

exports.create = async (req, res) => {
  try {
    const penalty = await Penalty.create(req.body);
    res.status(201).json(penalty);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const [count] = await Penalty.update(req.body, { where: { penalty_id: req.params.id } });
    if (!count) return res.status(404).json({ error: 'Not found' });
    const updated = await Penalty.findByPk(req.params.id);
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.delete = async (req, res) => {
  const count = await Penalty.destroy({ where: { penalty_id: req.params.id } });
  if (!count) return res.status(404).json({ error: 'Not found' });
  res.json({ success: true });
}; 