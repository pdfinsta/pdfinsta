require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const cors = require('cors');
const connectDB = require('./config/db');

const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const adminRoutes = require('./routes/admin');

const app = express();

connectDB();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // SSLCommerz posts form-encoded callbacks

app.use(session({
  secret: process.env.SESSION_SECRET || 'dev_secret_change_me',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, maxAge: 1000 * 60 * 60 * 4 } // 4 hours
}));

app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);

app.use(express.static(path.join(__dirname, 'public')));

app.get('/health', (req, res) => res.json({ ok: true }));
app.get('/api/config', (req, res) => {
  res.json({
    bkashNumber: process.env.MANUAL_BKASH_NUMBER || '',
    nagadNumber: process.env.MANUAL_NAGAD_NUMBER || ''
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`PDF store running on port ${PORT}`));
