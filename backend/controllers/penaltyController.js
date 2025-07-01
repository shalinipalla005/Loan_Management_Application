const { Penalty, RepaymentSchedule, Loan } = require('../models');

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

// Auto-apply penalties for overdue payments
exports.applyOverduePenalties = async (req, res) => {
  try {
    const overdueSchedules = await RepaymentSchedule.findAll({
      where: { payment_status: 'OVERDUE' }
    });
    let count = 0;
    for (const schedule of overdueSchedules) {
      // Check if penalty already exists for this schedule
      const existing = await Penalty.findOne({ where: { schedule_id: schedule.schedule_id, penalty_type: 'LATE_PAYMENT' } });
      if (!existing) {
        // Get penalty amount from loan product or use default
        const loan = await Loan.findByPk(schedule.loan_id);
        const penaltyAmount = 1000.00; // TODO: fetch from loan product if needed
        await Penalty.create({
          loan_id: schedule.loan_id,
          schedule_id: schedule.schedule_id,
          penalty_type: 'LATE_PAYMENT',
          penalty_amount: penaltyAmount,
          penalty_date: new Date(),
          due_date: schedule.due_date,
          status: 'PENDING'
        });
        // Update schedule penalty_applied
        await schedule.update({ penalty_applied: penaltyAmount });
        count++;
      }
    }
    res.json({ success: true, message: `Applied penalties to ${count} overdue schedules.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}; 