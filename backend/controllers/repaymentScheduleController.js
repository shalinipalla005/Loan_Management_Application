const { RepaymentSchedule } = require('../models');

exports.list = async (req, res) => {
  const schedules = await RepaymentSchedule.findAll();
  res.json(schedules);
};

exports.get = async (req, res) => {
  const schedule = await RepaymentSchedule.findByPk(req.params.id);
  if (!schedule) return res.status(404).json({ error: 'Not found' });
  res.json(schedule);
};

exports.create = async (req, res) => {
  try {
    const schedule = await RepaymentSchedule.create(req.body);
    res.status(201).json(schedule);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const [count] = await RepaymentSchedule.update(req.body, { where: { schedule_id: req.params.id } });
    if (!count) return res.status(404).json({ error: 'Not found' });
    const updated = await RepaymentSchedule.findByPk(req.params.id);
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.delete = async (req, res) => {
  const count = await RepaymentSchedule.destroy({ where: { schedule_id: req.params.id } });
  if (!count) return res.status(404).json({ error: 'Not found' });
  res.json({ success: true });
}; 