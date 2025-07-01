const { LoanProduct } = require('../models');
const IDGenerator = require('../utils/idGenerator');

exports.list = async (req, res) => {
  try {
    const products = await LoanProduct.findAll({
      order: [['created_at', 'DESC']]
    });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.get = async (req, res) => {
  try {
    const product = await LoanProduct.findByPk(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    // Auto-generate product name if not provided
    if (!req.body.product_name) {
      req.body.product_name = await IDGenerator.generateProductName();
    }
    
    // Set default values
    req.body.status = req.body.status || 'ACTIVE';
    req.body.society_id = req.body.society_id || 1; // Default to first society
    req.body.processing_fee_rate = req.body.processing_fee_rate || 1.00;
    req.body.monthly_savings_required = req.body.monthly_savings_required || 200.00;
    req.body.savings_interest_rate = req.body.savings_interest_rate || 6.00;
    req.body.penalty_amount = req.body.penalty_amount || 1000.00;
    
    const product = await LoanProduct.create(req.body);
    res.status(201).json(product);
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      res.status(400).json({ error: 'Product name already exists' });
    } else {
      res.status(400).json({ error: err.message });
    }
  }
};

exports.update = async (req, res) => {
  try {
    const product = await LoanProduct.findByPk(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    await product.update(req.body);
    res.json(product);
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      res.status(400).json({ error: 'Product name already exists' });
    } else {
      res.status(400).json({ error: err.message });
    }
  }
};

exports.delete = async (req, res) => {
  try {
    const product = await LoanProduct.findByPk(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    await product.destroy();
    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    if (err.name === 'SequelizeForeignKeyConstraintError') {
      res.status(400).json({ error: 'Cannot delete product with existing loans' });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
}; 