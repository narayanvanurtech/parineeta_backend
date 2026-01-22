const validator = require('validator');
const mongoose = require('mongoose');

// Create Product Validation
const validateCreateProduct = (req, res, next) => {
  const { name, description, price, category, stock, sizes, colors, images } = req.body;
  const errors = [];

  // Name validation
  if (!name || !name.trim()) {
    errors.push('Product name is required');
  } else if (name.trim().length < 3) {
    errors.push('Product name must be at least 3 characters long');
  } else if (name.trim().length > 200) {
    errors.push('Product name must not exceed 200 characters');
  }

  // Description validation optional
  if (description && description.length > 2000) {
    errors.push('Description must not exceed 2000 characters');
  }

  // Price validation
  if (price === undefined || price === null) {
    errors.push('Price is required');
  } else if (typeof price !== 'number') {
    errors.push('Price must be a number');
  } else if (price < 0) {
    errors.push('Price cannot be negative');
  } else if (price > 1000000) {
    errors.push('Price cannot exceed 1,000,000');
  } else if (!/^\d+(\.\d{1,2})?$/.test(price.toString())) {
    errors.push('Price can have at most 2 decimal places');
  }

  // Category validation
  if (!category || !category.trim()) {
    errors.push('Category is required');
  } else if (category.trim().length < 2) {
    errors.push('Category must be at least 2 characters long');
  } else if (category.trim().length > 100) {
    errors.push('Category must not exceed 100 characters');
  }

  // Stock validation
  if (stock === undefined || stock === null) {
    errors.push('Stock is required');
  } else if (!Number.isInteger(stock)) {
    errors.push('Stock must be an integer');
  } else if (stock < 0) {
    errors.push('Stock cannot be negative');
  } else if (stock > 100000) {
    errors.push('Stock cannot exceed 100,000');
  }

  // Sizes validation
  if (!Array.isArray(sizes) || sizes.length === 0) {
    errors.push('Sizes must be a non-empty array');
  } else {
    const validSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
    sizes.forEach((size, index) => {
      if (!validSizes.includes(size.toUpperCase())) {
        errors.push(`Size "${size}" is not valid. Must be one of: ${validSizes.join(', ')}`);
      }
    });
  }

  // Colors validation
  if (!Array.isArray(colors) || colors.length === 0) {
    errors.push('Colors must be a non-empty array');
  } else {
    colors.forEach((color, index) => {
      if (typeof color !== 'string' || !color.trim()) {
        errors.push(`Color at index ${index} must be a non-empty string`);
      }
    });
  }

  // Images validation optional
  if (images !== undefined) {
    if (!Array.isArray(images)) {
      errors.push('Images must be an array');
    } else if (images.length > 10) {
      errors.push('Cannot upload more than 10 images');
    } else {
      images.forEach((img, index) => {
        if (typeof img !== 'string') {
          errors.push(`Image ${index + 1} must be a string (URL)`);
        } else if (!validator.isURL(img, { protocols: ['http', 'https'], require_protocol: true })) {
          errors.push(`Image ${index + 1} must be a valid URL`);
        }
      });
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

// Update Product Validation
const validateUpdateProduct = (req, res, next) => {
  const { name, description, price, category, stock, sizes, colors, images } = req.body;
  const errors = [];

  // Check if at least one field is provided
  if (name === undefined && description === undefined && price === undefined && 
      category === undefined && stock === undefined && sizes === undefined && 
      colors === undefined && images === undefined) {
    return res.status(400).json({
      error: 'At least one field must be provided for update'
    });
  }

  // Name validation if provided
  if (name !== undefined) {
    if (!name.trim()) {
      errors.push('Product name cannot be empty');
    } else if (name.trim().length < 3) {
      errors.push('Product name must be at least 3 characters long');
    } else if (name.trim().length > 200) {
      errors.push('Product name must not exceed 200 characters');
    }
  }

  // Description validation if provided
  if (description !== undefined && description.length > 2000) {
    errors.push('Description must not exceed 2000 characters');
  }

  // Price validation if provided
  if (price !== undefined) {
    if (typeof price !== 'number') {
      errors.push('Price must be a number');
    } else if (price < 0) {
      errors.push('Price cannot be negative');
    } else if (price > 1000000) {
      errors.push('Price cannot exceed 1,000,000');
    } else if (!/^\d+(\.\d{1,2})?$/.test(price.toString())) {
      errors.push('Price can have at most 2 decimal places');
    }
  }

  // Category validation if provided
  if (category !== undefined) {
    if (!category.trim()) {
      errors.push('Category cannot be empty');
    } else if (category.trim().length < 2) {
      errors.push('Category must be at least 2 characters long');
    } else if (category.trim().length > 100) {
      errors.push('Category must not exceed 100 characters');
    }
  }

  // Stock validation if provided
  if (stock !== undefined) {
    if (!Number.isInteger(stock)) {
      errors.push('Stock must be an integer');
    } else if (stock < 0) {
      errors.push('Stock cannot be negative');
    } else if (stock > 100000) {
      errors.push('Stock cannot exceed 100,000');
    }
  }

  // Images validation if provided
  if (images !== undefined) {
    if (!Array.isArray(images)) {
      errors.push('Images must be an array');
    } else if (images.length > 10) {
      errors.push('Cannot upload more than 10 images');
    } else {
      images.forEach((img, index) => {
        if (typeof img !== 'string') {
          errors.push(`Image ${index + 1} must be a string (URL)`);
        } else if (!validator.isURL(img, { protocols: ['http', 'https'], require_protocol: true })) {
          errors.push(`Image ${index + 1} must be a valid URL`);
        }
      });
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

// Validate Product ID
const validateProductId = (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      error: 'Invalid product ID format'
    });
  }

  next();
};

module.exports = {
  validateCreateProduct,
  validateUpdateProduct,
  validateProductId
};
