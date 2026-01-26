const express = require('express');
const router = express.Router();

console.log('🔄 Starting routes initialization...');

// Import all route files
const authRoutes = require('./auth');
const productRoutes = require('./products');
const orderRoutes = require('./orders');
const cartRoutes = require('./cart');
const categoryRoutes = require('./categories');
const subtitleRoutes=require("./subtitles")
const userRoutes = require('./users');
const addressRoutes = require('./address');
const wishlistRoutes = require('./wishlist');
const paymentRoutes = require('./payments');
const adminRoutes = require('./admin');
const blogRoutes = require("./blogs")
const zibaRoutes = require("./ziba")


console.log('✅ All route modules imported');

// Simple test route
router.get('/admin-test', (req, res) => {
  console.log('📞 Admin test route called');
  res.json({
    success: true,
    message: 'Admin test route working',
    timestamp: new Date().toISOString()
  });
});


// Mount all routes
router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/orders', orderRoutes);
router.use('/cart', cartRoutes);
router.use('/categories', categoryRoutes);
router.use("/subtitles",subtitleRoutes)
router.use('/users', userRoutes);
router.use('/address', addressRoutes);
router.use('/wishlist', wishlistRoutes);
router.use('/payments', paymentRoutes);
router.use('/admin', adminRoutes);
router.use("/blogs",blogRoutes)
router.use("/ziba",zibaRoutes)

console.log('🎉 All routes mounted successfully!');

module.exports = router;