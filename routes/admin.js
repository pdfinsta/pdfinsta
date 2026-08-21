const express = require('express');
const router = express.Router();
const requireAdmin = require('../middleware/adminAuth');
const Product = require('../models/Product');
const Order = require('../models/Order');

// ---- Auth ----
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username === process.env.ADMIN_USER && password === process.env.ADMIN_PASS) {
    req.session.isAdmin = true;
    return res.json({ ok: true });
  }
  res.status(401).json({ error: 'Invalid credentials' });
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

router.get('/session', (req, res) => {
  res.json({ isAdmin: !!(req.session && req.session.isAdmin) });
});

// Everything below requires an admin session
router.use(requireAdmin);

// ---- Products ----
router.get('/products', async (req, res) => {
  const products = await Product.find().sort({ createdAt: -1 });
  res.json(products);
});

router.post('/products', async (req, res) => {
  try {
    const { title, description, price, category, coverImage, driveLink, pageCount } = req.body;
    if (!title || !description || price == null || !coverImage || !driveLink) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const product = await Product.create({ title, description, price, category, coverImage, driveLink, pageCount });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: 'Could not create product' });
  }
});

router.put('/products/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: 'Could not update product' });
  }
});

router.delete('/products/:id', async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Could not delete product' });
  }
});

// ---- Orders ----
router.get('/orders', async (req, res) => {
  const orders = await Order.find().sort({ createdAt: -1 }).populate('product', 'title');
  res.json(orders);
});

router.post('/orders/:id/approve', async (req, res) => {
  const order = await Order.findByIdAndUpdate(req.params.id, { status: 'approved' }, { new: true });
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json(order);
});

router.post('/orders/:id/reject', async (req, res) => {
  const order = await Order.findByIdAndUpdate(req.params.id, { status: 'rejected' }, { new: true });
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json(order);
});

module.exports = router;
