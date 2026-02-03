const validator = require('validator');

// Validate category ID
const validateCategoryId = (req, res, next) => {
  const { id } = req.params;
  
  if (!id || !validator.isMongoId(id)) {
    return res.status(400).json({
      error: 'Invalid category ID format'
    });
  }
  
  next();
};

// Validate create category
const validateCreateCategory = (req, res, next) => {
  const { name, description } = req.body;
  const errors = [];

  // Name validation
  if (!name || !name.trim()) {
    errors.push('Category name is required');
  } else if (name.trim().length < 2) {
    errors.push('Category name must be at least 2 characters long');
  } else if (name.trim().length > 50) {
    errors.push('Category name must not exceed 50 characters');
  }

  // Description validation 
  if (description && description.length > 500) {
    errors.push('Description must not exceed 500 characters');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors
    });
  }

  next();
};

// Validate update category
const validateUpdateCategory = (req, res, next) => {
  const { name, description } = req.body;
  const errors = [];

  // Check if at least one field is provided
  if (!name && description === undefined) {
    return res.status(400).json({
      error: 'At least one field (name or description) must be provided for update'
    });
  }

  // Name validation (if provided)
  if (name !== undefined) {
    if (!name.trim()) {
      errors.push('Category name cannot be empty');
    } else if (name.trim().length < 2) {
      errors.push('Category name must be at least 2 characters long');
    } else if (name.trim().length > 50) {
      errors.push('Category name must not exceed 50 characters');
    }
  }

  // Description validation (if provided)
  if (description !== undefined && description.length > 500) {
    errors.push('Description must not exceed 500 characters');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors
    });
  }

  next();
};


module.exports = {
  validateCategoryId,
  validateCreateCategory,
  validateUpdateCategory
};