const { Loan } = require('../models');

exports.list = async (req, res) => {
  const loans = await Loan.findAll();
  res.json(loans);
};

exports.get = async (req, res) => {
  const loan = await Loan.findByPk(req.params.id);
  if (!loan) return res.status(404).json({ error: 'Not found' });
  res.json(loan);
};

exports.create = async (req, res) => {
  try {
    const loan = await Loan.create(req.body);
    res.status(201).json(loan);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const [count] = await Loan.update(req.body, { where: { loan_id: req.params.id } });
    if (!count) return res.status(404).json({ error: 'Not found' });
    const updated = await Loan.findByPk(req.params.id);
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.delete = async (req, res) => {
  const count = await Loan.destroy({ where: { loan_id: req.params.id } });
  if (!count) return res.status(404).json({ error: 'Not found' });
  res.json({ success: true });
}; 