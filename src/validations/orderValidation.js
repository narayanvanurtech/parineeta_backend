const mongoose = require('mongoose');

// Create Order Validation
const validateCreateOrder = (req, res, next) => {
  const { shippingAddress, paymentMethod } = req.body;
  const errors = [];

  // Shipping Address validation
  if (!shippingAddress) {
    errors.push('Shipping address is required');
  } else if (!mongoose.Types.ObjectId.isValid(shippingAddress)) {
    errors.push('Invalid shipping address ID format');
  }

  // Payment Method validation
  if (!paymentMethod || !paymentMethod.trim()) {
    errors.push('Payment method is required');
  } else {
    const validPaymentMethods = ['credit_card', 'debit_card', 'upi', 'net_banking', 'cod', 'wallet'];
    if (!validPaymentMethods.includes(paymentMethod.toLowerCase())) {
      errors.push(`Payment method must be one of: ${validPaymentMethods.join(', ')}`);
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors
    });
  }

  next();
};

// Update Order Status Validation
const validateUpdateOrderStatus = (req, res, next) => {
  const { status } = req.body;
  const errors = [];

  // Status validation
  if (!status || !status.trim()) {
    errors.push('Status is required');
  } else {
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status.toLowerCase())) {
      errors.push(`Status must be one of: ${validStatuses.join(', ')}`);
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors
    });
  }

  next();
};

// Validate Order ID
const validateOrderId = (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      error: 'Invalid order ID format'
    });
  }

  next();
};

module.exports = {
  validateCreateOrder,
  validateUpdateOrderStatus,
  validateOrderId
};