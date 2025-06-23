const { Member } = require('../models');

// List all members
async function listMembers(req, res) {
  try {
    const members = await Member.findAll();
    res.json(members);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Get a member by ID
async function getMemberById(req, res) {
  try {
    const member = await Member.findByPk(req.params.id);
    if (!member) return res.status(404).json({ error: 'Member not found' });
    res.json(member);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  listMembers,
  getMemberById,
}; 