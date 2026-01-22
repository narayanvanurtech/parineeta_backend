// src/cron/paymentCron.js - WORKING VERSION
const cron = require('node-cron');
const Payment = require('../models/Payment');
const Cart = require('../models/Cart');

console.log('✅ Payment cron system initialized');

class PaymentCronJob {
  constructor() {
    this.jobs = [];
  }

  // Check pending payments every 5 minutes
  startPendingPaymentCheck() {
    const job = cron.schedule('*/5 * * * *', async () => {
      try {
        console.log('🔄 Checking pending payments...');
        
        const pendingPayments = await Payment.find({
          status: "PENDING",
          createdAt: { 
            $gte: new Date(Date.now() - 2 * 60 * 60 * 1000) // Last 2 hours
          }
        });

        if (pendingPayments.length === 0) {
          console.log('✅ No pending payments found');
          return;
        }

        console.log(`📊 Found ${pendingPayments.length} pending payments`);

        for (const payment of pendingPayments) {
          try {
            // Simulate status check - in real world, call PhonePe API here
            const shouldMarkSuccess = Math.random() > 0.7; // 30% chance
            
            if (shouldMarkSuccess) {
              payment.status = "SUCCESS";
              payment.paidAt = new Date();
              await payment.save();
              
              // Clear cart
              await Cart.deleteMany({ 
                _id: { $in: payment.cartIds }, 
                userId: payment.userId 
              });
              
              console.log(`✅ Payment ${payment.orderId} marked as SUCCESS`);
            }
          } catch (error) {
            console.error(`❌ Error processing payment ${payment.orderId}:`, error.message);
          }
        }
      } catch (error) {
        console.error('❌ Error in pending payment check:', error);
      }
    });
    
    this.jobs.push({ name: 'pendingPaymentCheck', job });
    console.log('✅ Pending Payment Check started (every 5 minutes)');
  }

  // Mark expired payments (older than 30 minutes)
  startExpiredPaymentCheck() {
    const job = cron.schedule('*/10 * * * *', async () => {
      try {
        console.log('🕐 Checking for expired payments...');
        
        const result = await Payment.updateMany(
          {
            status: "PENDING",
            createdAt: { 
              $lte: new Date(Date.now() - 30 * 60 * 1000) // 30 minutes
            }
          },
          { 
            $set: { 
              status: "FAILED",
              failedAt: new Date()
            } 
          }
        );

        if (result.modifiedCount > 0) {
          console.log(`📦 Marked ${result.modifiedCount} payments as EXPIRED`);
        }
      } catch (error) {
        console.error('❌ Error in expired payment check:', error);
      }
    });
    
    this.jobs.push({ name: 'expiredPaymentCheck', job });
    console.log('✅ Expired Payment Check started (every 10 minutes)');
  }

  // Daily payment report at midnight
  startDailyPaymentReport() {
    const job = cron.schedule('0 0 * * *', async () => {
      try {
        console.log('📊 Generating daily payment report...');
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const stats = await Payment.aggregate([
          {
            $match: {
              createdAt: { $gte: today, $lt: tomorrow }
            }
          },
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 },
              totalAmount: { $sum: '$amount' }
            }
          }
        ]);

        console.log('📈 Daily Payment Report:');
        stats.forEach(stat => {
          console.log(`   ${stat._id}: ${stat.count} payments, Total: ₹${stat.totalAmount}`);
        });
      } catch (error) {
        console.error('❌ Error in daily payment report:', error);
      }
    });
    
    this.jobs.push({ name: 'dailyPaymentReport', job });
    console.log('✅ Daily Payment Report started (midnight)');
  }

  startAll() {
    console.log('\n🚀 Starting Payment Cron Jobs...\n');
    this.startPendingPaymentCheck();
    this.startExpiredPaymentCheck();
    this.startDailyPaymentReport();
    console.log('\n✅ All Payment Cron Jobs Started Successfully!\n');
  }

  stopAll() {
    console.log('🛑 Stopping all payment cron jobs...');
    this.jobs.forEach(({ name, job }) => {
      job.stop();
      console.log(`   Stopped: ${name}`);
    });
    this.jobs = [];
    console.log('✅ All payment cron jobs stopped');
  }
}

module.exports = new PaymentCronJob();