// config/phonepe.js - FOR CLIENT_ID/CLIENT_SECRET
const { StandardCheckoutClient, Env } = require("pg-sdk-node");

let phonePeClient = null;

const getPhonePeClient = () => {
  if (!phonePeClient) {
    console.log('🔧 Initializing PhonePe Client with CLIENT_ID/CLIENT_SECRET');
    
    if (!process.env.PHONEPE_CLIENT_ID || !process.env.PHONEPE_CLIENT_SECRET) {
      throw new Error("PhonePe CLIENT_ID and CLIENT_SECRET are required");
    }

    let environment;
    switch (process.env.PAYMENT_ENV) {
      case "PRODUCTION":
        environment = Env.PRODUCTION;
        break;
      case "TEST":
      default:
        environment = Env.SANDBOX;
    }

    console.log('📋 PhonePe Config:', {
      environment: process.env.PAYMENT_ENV,
      clientId: process.env.PHONEPE_CLIENT_ID,
      clientSecretSet: !!process.env.PHONEPE_CLIENT_SECRET
    });

    try {
      phonePeClient = StandardCheckoutClient.getInstance(
        process.env.PHONEPE_CLIENT_ID,
        process.env.PHONEPE_CLIENT_SECRET,
        1, // saltIndex
        environment
      );
      console.log('✅ PhonePe Client initialized successfully');
    } catch (error) {
      console.error('❌ PhonePe Client initialization failed:', error.message);
      throw new Error('Payment gateway configuration error: ' + error.message);
    }
  }
  return phonePeClient;
};

module.exports = { getPhonePeClient };
