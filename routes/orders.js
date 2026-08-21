const express = require('express');
const router = express.Router();
const { customAlphabet } = require('nanoid');
const Product = require('../models/Product');
const Order = require('../models/Order');
const { getClient } = require('../utils/sslcommerz');

const genId = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 6);

function newOrderId() {
  return `PDF-${genId()}`;
}

// ---- Create a manual (bKash/Nagad) order ----
router.post('/manual', async (req, res) => {
  try {
    const { productId, buyerName, buyerEmail, buyerPhone, manualMethod, manualSender, manualTrxId } = req.body;
    if (!productId || !buyerName || !buyerEmail || !manualTrxId || !manualSender) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const product = await Product.findOne({ _id: productId, active: true });
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const order = await Order.create({
      orderId: newOrderId(),
      product: product._id,
      productTitle: product.title,
      amount: product.price,
      buyerName, buyerEmail, buyerPhone,
      paymentMethod: 'manual',
      manualMethod, manualSender, manualTrxId,
      status: 'pending'
    });

    res.json({ orderId: order.orderId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not create order' });
  }
});

// ---- Create an online (SSLCommerz) order and get a payment URL ----
router.post('/online', async (req, res) => {
  try {
    const { productId, buyerName, buyerEmail, buyerPhone } = req.body;
    if (!productId || !buyerName || !buyerEmail || !buyerPhone) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const product = await Product.findOne({ _id: productId, active: true });
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const orderId = newOrderId();
    await Order.create({
      orderId,
      product: product._id,
      productTitle: product.title,
      amount: product.price,
      buyerName, buyerEmail, buyerPhone,
      paymentMethod: 'online',
      status: 'pending'
    });

    const siteUrl = process.env.SITE_URL;
    const data = {
      total_amount: product.price,
      currency: 'BDT',
      tran_id: orderId,
      success_url: `${siteUrl}/api/orders/ssl/success`,
      fail_url: `${siteUrl}/api/orders/ssl/fail`,
      cancel_url: `${siteUrl}/api/orders/ssl/cancel`,
      ipn_url: `${siteUrl}/api/orders/ssl/ipn`,
      shipping_method: 'NO',
      product_name: product.title,
      product_category: product.category || 'Digital',
      product_profile: 'digital-goods',
      cus_name: buyerName,
      cus_email: buyerEmail,
      cus_add1: 'N/A',
      cus_city: 'N/A',
      cus_postcode: '0000',
      cus_country: 'Bangladesh',
      cus_phone: buyerPhone,
      ship_name: buyerName,
      ship_add1: 'N/A',
      ship_city: 'N/A',
      ship_postcode: '0000',
      ship_country: 'Bangladesh'
    };

    const sslcz = getClient();
    const apiResponse = await sslcz.init(data);
    if (apiResponse && apiResponse.GatewayPageURL) {
      res.json({ gatewayUrl: apiResponse.GatewayPageURL });
    } else {
      await Order.findOneAndUpdate({ orderId }, { status: 'failed' });
      res.status(502).json({ error: 'Payment gateway did not return a checkout URL. Check your SSLCommerz credentials.' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not start payment' });
  }
});

// ---- SSLCommerz callbacks (posted as application/x-www-form-urlencoded) ----
router.post('/ssl/success', async (req, res) => {
  const tran_id = req.body.tran_id;
  await Order.findOneAndUpdate({ orderId: tran_id }, {
    status: 'paid',
    sslTransactionId: req.body.val_id || req.body.bank_tran_id || ''
  });
  res.redirect(`/success.html?orderId=${tran_id}`);
});

router.post('/ssl/fail', async (req, res) => {
  const tran_id = req.body.tran_id;
  let productId = '';
  if (tran_id) {
    const order = await Order.findOneAndUpdate({ orderId: tran_id }, { status: 'failed' });
    if (order) productId = order.product;
  }
  res.redirect(`/checkout.html?id=${productId}&failed=1`);
});

router.post('/ssl/cancel', async (req, res) => {
  const tran_id = req.body.tran_id;
  let productId = '';
  if (tran_id) {
    const order = await Order.findOneAndUpdate({ orderId: tran_id }, { status: 'failed' });
    if (order) productId = order.product;
  }
  res.redirect(`/checkout.html?id=${productId}&cancelled=1`);
});

router.post('/ssl/ipn', async (req, res) => {
  // Optional server-to-server confirmation; safe to just acknowledge.
  res.sendStatus(200);
});

// ---- Track an order: buyer supplies orderId + the email used at checkout ----
router.get('/:orderId', async (req, res) => {
  try {
    const { email } = req.query;
    const order = await Order.findOne({ orderId: req.params.orderId });
    if (!order || !email || order.buyerEmail.toLowerCase() !== String(email).toLowerCase()) {
      return res.status(404).json({ error: 'Order not found. Check your Order ID and email.' });
    }

    const unlocked = order.status === 'paid' || order.status === 'approved';
    let driveLink = null;
    if (unlocked) {
      const product = await Product.findById(order.product);
      driveLink = product ? product.driveLink : null;
    }

    res.json({
      orderId: order.orderId,
      productTitle: order.productTitle,
      amount: order.amount,
      status: order.status,
      paymentMethod: order.paymentMethod,
      createdAt: order.createdAt,
      driveLink
    });
  } catch (err) {
    res.status(404).json({ error: 'Order not found' });
  }
});

module.exports = router;
