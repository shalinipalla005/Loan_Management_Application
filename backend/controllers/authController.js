const { Member } = require('../models');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const config = require('../config/config');

// Register a new member (user)
async function register(req, res) {
  try {
    const { member_name, membership_number, password, society_id } = req.body;
    if (!member_name || !membership_number || !password || !society_id) {
      return res.status(400).json({ error: 'All fields are required.' });
    }
    const existing = await Member.findOne({ where: { membership_number } });
    if (existing) {
      return res.status(409).json({ error: 'Membership number already exists.' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const member = await Member.create({
      member_name,
      membership_number,
      password: hashedPassword,
      society_id
    });
    res.status(201).json({ message: 'Registration successful', member_id: member.member_id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Login
async function login(req, res) {
  try {
    const { membership_number, password } = req.body;
    if (!membership_number || !password) {
      return res.status(400).json({ error: 'Membership number and password are required.' });
    }
    const member = await Member.findOne({ where: { membership_number } });
    if (!member || !member.password) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }
    const valid = await bcrypt.compare(password, member.password);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }
    const token = jwt.sign(
      { member_id: member.member_id, membership_number: member.membership_number, society_id: member.society_id },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );
    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { register, login }; 