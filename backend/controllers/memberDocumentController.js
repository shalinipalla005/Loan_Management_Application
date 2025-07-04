const { MemberDocument } = require('../models');

exports.list = async (req, res) => {
  const docs = await MemberDocument.findAll();
  res.json(docs);
};

exports.get = async (req, res) => {
  const doc = await MemberDocument.findByPk(req.params.id);
  if (!doc) return res.status(404).json({ error: 'Not found' });
  res.json(doc);
};

exports.create = async (req, res) => {
  try {
    const doc = await MemberDocument.create(req.body);
    res.status(201).json(doc);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const [count] = await MemberDocument.update(req.body, { where: { document_id: req.params.id } });
    if (!count) return res.status(404).json({ error: 'Not found' });
    const updated = await MemberDocument.findByPk(req.params.id);
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.delete = async (req, res) => {
  const count = await MemberDocument.destroy({ where: { document_id: req.params.id } });
  if (!count) return res.status(404).json({ error: 'Not found' });
  res.json({ success: true });
}; 