const mongoose = require('mongoose');

// Add to Cart Validation 
const validateAddToCart = (req, res, next) => {
  const { productId, quantity } = req.body;
  const errors = [];

  // Product ID validation
  if (!productId) {
    errors.push('Product ID is required');
  } else if (!mongoose.Types.ObjectId.isValid(productId)) {
    errors.push('Invalid product ID format');
  }

  // Quantity validation
  if (quantity === undefined || quantity === null) {
    errors.push('Quantity is required');
  } else if (!Number.isInteger(quantity)) {
    errors.push('Quantity must be an integer');
  } else if (quantity < 1) {
    errors.push('Quantity must be at least 1');
  } else if (quantity > 100) {
    errors.push('Quantity cannot exceed 100');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors
    });
  }

  next();
};

// Update Cart Item Validation
const validateUpdateCartItem = (req, res, next) => {
  const { quantity } = req.body;
  const { id } = req.params;
  const errors = [];

  // Cart Item ID validation
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      error: 'Invalid cart item ID format'
    });
  }


  // Quantity validation
  if (quantity === undefined || quantity === null) {
    errors.push('Quantity is required');
  } else if (!Number.isInteger(quantity)) {
    errors.push('Quantity must be an integer');
  } else if (quantity < 1) {
    errors.push('Quantity must be at least 1');
  } else if (quantity > 100) {
    errors.push('Quantity cannot exceed 100');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors
    });
  }

  next();
};

// Validate Cart Item ID
const validateCartItemId = (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      error: 'Invalid cart item ID format'
    });
  }

  next();
};

module.exports = {
  validateAddToCart,
  validateUpdateCartItem,
  validateCartItemId
};
