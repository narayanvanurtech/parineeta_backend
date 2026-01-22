const PaymentService = require('../services/paymentService');

exports.initiatePayment = async (req, res) => {
  try {
    const { orderId, addressId } = req.body; // CHANGED: cartId to orderId
    const userId = req.user._id;

    console.log('🎯 Payment initiation request for order:', orderId, 'user:', userId);

    if (!orderId || !addressId) { // CHANGED: cartId to orderId
      return res.status(400).json({
        success: false,
        error: "Order ID and Address ID are required" // CHANGED error message
      });
    }

    const result = await PaymentService.initiatePayment({
      orderId, // CHANGED: cartId to orderId
      userId,
      addressId,
    });

    res.status(200).json(result);

  } catch (error) {
    console.error('❌ Initiate Payment Error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

exports.checkStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user._id;

    console.log('🔍 Checking payment status for:', orderId);

    const result = await PaymentService.checkPaymentStatus(orderId);

    res.status(200).json(result);

  } catch (error) {
    console.error('❌ Check Status Error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// ... rest of the methods remain the same
