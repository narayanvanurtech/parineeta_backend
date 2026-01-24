require('dotenv').config();

console.log('🔍 DEBUG: Checking PhonePe Environment Variables:');
console.log('   PHONEPE_CLIENT_ID:', process.env.PHONEPE_CLIENT_ID ? 'SET' : 'NOT SET');
console.log('   PHONEPE_CLIENT_SECRET:', process.env.PHONEPE_CLIENT_SECRET ? 'SET' : 'NOT SET');
console.log('   PAYMENT_ENV:', process.env.PAYMENT_ENV || 'NOT SET');
console.log('   MERCHANT_REDIRECT_URL:', process.env.MERCHANT_REDIRECT_URL || 'NOT SET');

const connectDB = require('./src/config/mongoose'); 
const app = require('./app');
const paymentCron = require('./src/cron/paymentCron'); 

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🚀 E-Commerce Server Started Successfully!`);
    console.log(`${'='.repeat(60)}\n`);
    
    console.log(`📍 Server URL: http://localhost:${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
    console.log(`💾 Database: MongoDB connected\n`);
    
    console.log(`📡 API Endpoints:`);
    console.log(`   Health:      http://localhost:${PORT}/api/health`);
    console.log(`   Auth:        http://localhost:${PORT}/api/auth`);
    console.log(`   Products:    http://localhost:${PORT}/api/products`);
    console.log(`   Orders:      http://localhost:${PORT}/api/orders`);
    console.log(`   Cart:        http://localhost:${PORT}/api/cart`);
    console.log(`   Categories:  http://localhost:${PORT}/api/categories`);
    console.log(`   Subtitles:  http://localhost:${PORT}/api/subtitles`);
    console.log(`   Blogs:  http://localhost:${PORT}'/api/blogs',`);
    console.log(`   Users:       http://localhost:${PORT}/api/users`);
    console.log(`   Address:     http://localhost:${PORT}/api/address`);
    console.log(`   Wishlist:    http://localhost:${PORT}/api/wishlist`);
    console.log(`   Payments:    http://localhost:${PORT}/api/payments\n`);
    
    console.log(`💳 Payment Integration:`);
    console.log(`   Gateway:     PhonePe`);
    console.log(`   Mode:        ${process.env.PAYMENT_ENV || 'SANDBOX'}`);
    console.log(`   Status:      ✅ Active\n`);
    
    // Start payment cron jobs
    paymentCron.startAll();
    
    console.log(`${'='.repeat(60)}\n`);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('\n🛑 SIGTERM signal received: closing HTTP server');
    paymentCron.stopAll();
    process.exit(0);
  });

  process.on('SIGINT', () => {
    console.log('\n🛑 SIGINT signal received: closing HTTP server');
    paymentCron.stopAll();
    process.exit(0);
  });

}).catch(error => {
  console.error('❌ Failed to connect to MongoDB:', error);
  process.exit(1);
});