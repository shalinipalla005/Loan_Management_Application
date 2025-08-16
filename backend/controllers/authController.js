const { LoanOfficer, Society } = require('../models');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const config = require('../config/config');

// Officer Login
async function login(req, res) {
  try {
    const { identifier, password } = req.body; // identifier = employee_id or email
    if (!identifier || !password) {
      return res.status(400).json({ error: 'Employee ID/Email and password are required.' });
    }
    const officer = await LoanOfficer.findOne({
      where: {
        [require('sequelize').Op.or]: [
          { employee_id: identifier },
          { email: identifier }
        ]
      }
    });
    if (!officer || !officer.password) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }
    const valid = await bcrypt.compare(password, officer.password);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }
    const token = jwt.sign(
      { officer_id: officer.officer_id, employee_id: officer.employee_id, email: officer.email, role: officer.role, society_id: officer.society_id },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );
    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Officer Register (admin only)
async function register(req, res) {
  try {
    // Only admin can register officers (middleware should check this)
    const { officer_name, employee_id, email, password, role, society_id, contact_number, designation, hire_date, status } = req.body;
    if (!officer_name || !employee_id || !email || !password || !role) {
      return res.status(400).json({ error: 'All fields are required.' });
    }
    const existing = await LoanOfficer.findOne({ where: { [require('sequelize').Op.or]: [{ employee_id }, { email }] } });
    if (existing) {
      return res.status(409).json({ error: 'Employee ID or email already exists.' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const officer = await LoanOfficer.create({
      officer_name,
      employee_id,
      email,
      password: hashedPassword,
      role,
      society_id,
      contact_number,
      designation,
      hire_date,
      status: status || 'ACTIVE'
    });
    res.status(201).json({ message: 'Officer registered successfully', officer_id: officer.officer_id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Officer Signup (self-registration)
async function signup(req, res) {
  try {
    const { officer_name, email, password, contact_number, designation, society_id, account_type, registration_number } = req.body;
    if (!officer_name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }
    // For employee signups, block duplicate officer emails immediately
    if (account_type !== 'society') {
      const existing = await LoanOfficer.findOne({ where: { email } });
      if (existing) {
        return res.status(409).json({ error: 'Email already exists.' });
      }
    }
    // Generate employee_id automatically
    const IDGenerator = require('../utils/idGenerator');
    const employee_id = await IDGenerator.generateEmployeeId();
    const hashedPassword = await require('bcrypt').hash(password, 10);

    // If signing up as a society, validate against existing society (do NOT create)
    let resolvedSocietyId = society_id;
    if (account_type === 'society') {
      if (!registration_number) {
        return res.status(400).json({ error: 'Society registration number is required for society signup.' });
      }
      const existingSociety = await Society.findOne({ where: { registration_number } });
      if (!existingSociety) {
        return res.status(404).json({ error: 'No society found with the provided registration number.' });
      }
      // If society record has an email, enforce match to prevent misuse
      if (existingSociety.email && existingSociety.email.toLowerCase() !== String(email).toLowerCase()) {
        return res.status(400).json({ error: 'Email does not match the registered email for this society.' });
      }
      // If society record has a contact number and user provided one, enforce match
      if (existingSociety.contact_number && contact_number && String(existingSociety.contact_number) !== String(contact_number)) {
        return res.status(400).json({ error: 'Contact number does not match the registered contact number for this society.' });
      }
      resolvedSocietyId = existingSociety.society_id;

      // Now check officer email duplication (after validation). If exists, instruct to log in.
      const existingOfficer = await LoanOfficer.findOne({ where: { email } });
      if (existingOfficer) {
        return res.status(409).json({ error: 'An account with this email already exists. Please login instead.' });
      }
    }

    const officer = await LoanOfficer.create({
      officer_name,
      email,
      password: hashedPassword,
      contact_number,
      designation: account_type === 'employee' ? designation : null,
      society_id: resolvedSocietyId || 1,
      employee_id,
      role: account_type === 'society' ? 'client' : 'officer',
      status: 'ACTIVE'
    });
    res.status(201).json({ message: 'Signup successful', officer_id: officer.officer_id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { login, register, signup };