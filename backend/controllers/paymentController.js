const { Payment } = require('../models');

exports.list = async (req, res) => {
  const payments = await Payment.findAll();
  res.json(payments);
};

exports.get = async (req, res) => {
  const payment = await Payment.findByPk(req.params.id);
  if (!payment) return res.status(404).json({ error: 'Not found' });
  res.json(payment);
};

exports.create = async (req, res) => {
  try {
    const payment = await Payment.create(req.body);
    res.status(201).json(payment);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const [count] = await Payment.update(req.body, { where: { payment_id: req.params.id } });
    if (!count) return res.status(404).json({ error: 'Not found' });
    const updated = await Payment.findByPk(req.params.id);
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.delete = async (req, res) => {
  const count = await Payment.destroy({ where: { payment_id: req.params.id } });
  if (!count) return res.status(404).json({ error: 'Not found' });
  res.json({ success: true });
}; 