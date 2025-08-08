const { Member } = require('../models');
const IDGenerator = require('../utils/idGenerator');

// List all members
async function listMembers(req, res) {
  try {
    const members = await Member.findAll({
      order: [['created_at', 'DESC']]
    });
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

// Create a new member
async function createMember(req, res) {
  try {
    // Auto-generate membership number if not provided
    if (!req.body.membership_number) {
      req.body.membership_number = await IDGenerator.generateMemberId();
    }
    
    // Set default values
    req.body.membership_date = req.body.membership_date || new Date();
    req.body.membership_fee = req.body.membership_fee || 50.00;
    req.body.share_capital = req.body.share_capital || 1000.00;
    req.body.status = req.body.status || 'ACTIVE';
    
    const member = await Member.create(req.body);
    res.status(201).json(member);
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      res.status(400).json({ error: 'Membership number already exists' });
    } else if (err.name === 'SequelizeForeignKeyConstraintError') {
      res.status(400).json({ error: 'Invalid society ID' });
    } else {
      res.status(400).json({ error: err.message });
    }
  }
}

// Update a member
async function updateMember(req, res) {
  try {
    const member = await Member.findByPk(req.params.id);
    if (!member) return res.status(404).json({ error: 'Member not found' });
    await member.update(req.body);
    res.json(member);
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      res.status(400).json({ error: 'Membership number already exists' });
    } else if (err.name === 'SequelizeForeignKeyConstraintError') {
      res.status(400).json({ error: 'Invalid society ID' });
    } else {
      res.status(400).json({ error: err.message });
    }
  }
}

// Delete a member
async function deleteMember(req, res) {
  try {
    const member = await Member.findByPk(req.params.id);
    if (!member) return res.status(404).json({ error: 'Member not found' });
    await member.destroy();
    res.json({ message: 'Member deleted successfully' });
  } catch (err) {
    if (err.name === 'SequelizeForeignKeyConstraintError') {
      res.status(400).json({ error: 'Cannot delete member with existing loans or payments' });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
}

module.exports = {
  listMembers,
  getMemberById,
  createMember,
  updateMember,
  deleteMember,
}; 