const { LoanOfficer } = require('../models');

exports.list = async (req, res) => {
  const officers = await LoanOfficer.findAll();
  res.json(officers);
};

exports.get = async (req, res) => {
  const officer = await LoanOfficer.findByPk(req.params.id);
  if (!officer) return res.status(404).json({ error: 'Not found' });
  res.json(officer);
};

exports.create = async (req, res) => {
  try {
    const officer = await LoanOfficer.create(req.body);
    res.status(201).json(officer);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const [count] = await LoanOfficer.update(req.body, { where: { officer_id: req.params.id } });
    if (!count) return res.status(404).json({ error: 'Not found' });
    const updated = await LoanOfficer.findByPk(req.params.id);
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.delete = async (req, res) => {
  const count = await LoanOfficer.destroy({ where: { officer_id: req.params.id } });
  if (!count) return res.status(404).json({ error: 'Not found' });
  res.json({ success: true });
}; 