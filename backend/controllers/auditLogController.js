const { AuditLog } = require('../models');
const { Op } = require('sequelize');

exports.list = async (req, res) => {
  const where = {};
  if (req.query.table_name) where.table_name = req.query.table_name;
  if (req.query.action) where.action = req.query.action;
  if (req.query.user_id) where.user_id = req.query.user_id;
  if (req.query.record_id) where.record_id = req.query.record_id;
  const limit = parseInt(req.query.limit, 10) || 10;
  const offset = parseInt(req.query.offset, 10) || 0;
  const { rows: logs, count } = await AuditLog.findAndCountAll({
    where,
    order: [['timestamp', 'DESC']],
    limit,
    offset
  });
  res.json({ logs, count });
};

exports.get = async (req, res) => {
  const log = await AuditLog.findByPk(req.params.id);
  if (!log) return res.status(404).json({ error: 'Not found' });
  res.json(log);
}; 