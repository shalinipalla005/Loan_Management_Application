const { LoanStatusHistory } = require('../models');

exports.list = async (req, res) => {
  const history = await LoanStatusHistory.findAll();
  res.json(history);
};

exports.get = async (req, res) => {
  const record = await LoanStatusHistory.findByPk(req.params.id);
  if (!record) return res.status(404).json({ error: 'Not found' });
  res.json(record);
};

exports.create = async (req, res) => {
  try {
    const record = await LoanStatusHistory.create(req.body);
    res.status(201).json(record);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const [count] = await LoanStatusHistory.update(req.body, { where: { history_id: req.params.id } });
    if (!count) return res.status(404).json({ error: 'Not found' });
    const updated = await LoanStatusHistory.findByPk(req.params.id);
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.delete = async (req, res) => {
  const count = await LoanStatusHistory.destroy({ where: { history_id: req.params.id } });
  if (!count) return res.status(404).json({ error: 'Not found' });
  res.json({ success: true });
}; 