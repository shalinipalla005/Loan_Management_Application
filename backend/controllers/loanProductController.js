const { LoanProduct } = require('../models');

exports.list = async (req, res) => {
  const products = await LoanProduct.findAll();
  res.json(products);
};

exports.get = async (req, res) => {
  const product = await LoanProduct.findByPk(req.params.id);
  if (!product) return res.status(404).json({ error: 'Not found' });
  res.json(product);
};

exports.create = async (req, res) => {
  try {
    const product = await LoanProduct.create(req.body);
    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const [count] = await LoanProduct.update(req.body, { where: { product_id: req.params.id } });
    if (!count) return res.status(404).json({ error: 'Not found' });
    const updated = await LoanProduct.findByPk(req.params.id);
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.delete = async (req, res) => {
  const count = await LoanProduct.destroy({ where: { product_id: req.params.id } });
  if (!count) return res.status(404).json({ error: 'Not found' });
  res.json({ success: true });
}; 