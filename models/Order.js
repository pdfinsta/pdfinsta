const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true }, // short human-friendly ID, e.g. PDF-A1B2C3
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  productTitle: { type: String, required: true }, // snapshot at time of order
  amount: { type: Number, required: true },

  buyerName: { type: String, required: true },
  buyerEmail: { type: String, required: true },
  buyerPhone: { type: String },

  paymentMethod: { type: String, enum: ['online', 'manual'], required: true },

  // online (SSLCommerz) fields
  sslTransactionId: { type: String },

  // manual payment fields
  manualSender: { type: String },       // bKash/Nagad number the buyer paid from
  manualMethod: { type: String },       // 'bKash' | 'Nagad' | other
  manualTrxId: { type: String },        // Transaction ID buyer submits

  status: {
    type: String,
    enum: ['pending', 'paid', 'approved', 'rejected', 'failed'],
    default: 'pending'
  },
  // pending  = manual order awaiting admin review
  // paid     = SSLCommerz confirmed payment (auto), download unlocked
  // approved = admin manually approved, download unlocked
  // rejected = admin rejected manual submission
  // failed   = SSLCommerz payment failed/cancelled

}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
