const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  category: { type: String, default: 'General', trim: true },
  coverImage: { type: String, required: true }, // image URL for the product card
  driveLink: { type: String, required: true },  // Google Drive download link (only ever sent to buyers after payment)
  pageCount: { type: Number },
  active: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
