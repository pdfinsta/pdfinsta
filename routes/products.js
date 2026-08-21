const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// List all active products (drive link never included here)
router.get('/', async (req, res) => {
  try {
    const products = await Product.find({ active: true })
      .select('-driveLink')
      .sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: 'Could not load products' });
  }
});

// Single product detail (drive link never included here)
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, active: true }).select('-driveLink');
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(404).json({ error: 'Product not found' });
  }
});

module.exports = router;
