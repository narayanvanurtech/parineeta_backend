const validator = require('validator');
const mongoose = require('mongoose');

// Create Address Validation
const validateCreateAddress = (req, res, next) => {
  const { fullName, phone, street, city, state, zipCode, country, addressType, isDefault } = req.body;
  const errors = [];

  // Name validation
  if (!fullName || !fullName.trim()) {
    errors.push('Full name is required');
  } else if (fullName.trim().length < 2) {
    errors.push('Full name must be at least 2 characters long');
  } else if (fullName.trim().length > 100) {
    errors.push('Full name must not exceed 100 characters');
  } else if (!/^[a-zA-Z\s]+$/.test(fullName.trim())) {
    errors.push('Full name can only contain letters and spaces');
  }

  // Phone validation
  if (!phone || !phone.trim()) {
    errors.push('Phone number is required');
  } else if (!validator.isMobilePhone(phone, 'any', { strictMode: false })) {
    errors.push('Invalid phone number format');
  }

  // Street validation
  if (!street || !street.trim()) {
    errors.push('Street address is required');
  } else if (street.trim().length < 5) {
    errors.push('Street address must be at least 5 characters long');
  } else if (street.trim().length > 200) {
    errors.push('Street address must not exceed 200 characters');
  }

  // City validation
  if (!city || !city.trim()) {
    errors.push('City is required');
  } else if (city.trim().length < 2) {
    errors.push('City must be at least 2 characters long');
  } else if (city.trim().length > 100) {
    errors.push('City must not exceed 100 characters');
  } else if (!/^[a-zA-Z\s]+$/.test(city.trim())) {
    errors.push('City can only contain letters and spaces');
  }

  // State validation
  if (!state || !state.trim()) {
    errors.push('State is required');
  } else if (state.trim().length < 2) {
    errors.push('State must be at least 2 characters long');
  } else if (state.trim().length > 100) {
    errors.push('State must not exceed 100 characters');
  } else if (!/^[a-zA-Z\s]+$/.test(state.trim())) {
    errors.push('State can only contain letters and spaces');
  }

  // Pin Code validation
  if (!zipCode || !zipCode.trim()) {
    errors.push('Zip code is required');
  } else if (!/^\d{5,6}$/.test(zipCode.trim())) {
    errors.push('Zip code must be 5 or 6 digits');
  }

  // Country validation 
  if (country && country.trim()) {
    if (country.trim().length < 2) {
      errors.push('Country must be at least 2 characters long');
    } else if (country.trim().length > 100) {
      errors.push('Country must not exceed 100 characters');
    } else if (!/^[a-zA-Z\s]+$/.test(country.trim())) {
      errors.push('Country can only contain letters and spaces');
    }
  }

  // Address Type validation (optional)
  if (addressType && !['home', 'work', 'other'].includes(addressType)) {
    errors.push('Address type must be one of: home, work, other');
  }

  // IsDefault validation (optional)
  if (isDefault !== undefined && typeof isDefault !== 'boolean') {
    errors.push('isDefault must be a boolean value');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors
    });
  }

  next();
};

// Update Address Validation
const validateUpdateAddress = (req, res, next) => {
  const { fullName, phone, street, city, state, zipCode, country, addressType, isDefault } = req.body;
  const errors = [];

  // Check if at least one field is provided
  if (fullName === undefined && phone === undefined && street === undefined && 
      city === undefined && state === undefined && zipCode === undefined && 
      country === undefined && addressType === undefined && isDefault === undefined) {
    return res.status(400).json({
      error: 'At least one field must be provided for update'
    });
  }

  // Full Name validation if provided
  if (fullName !== undefined) {
    if (!fullName.trim()) {
      errors.push('Full name cannot be empty');
    } else if (fullName.trim().length < 2) {
      errors.push('Full name must be at least 2 characters long');
    } else if (fullName.trim().length > 100) {
      errors.push('Full name must not exceed 100 characters');
    } else if (!/^[a-zA-Z\s]+$/.test(fullName.trim())) {
      errors.push('Full name can only contain letters and spaces');
    }
  }

  // Phone validation if provided
  if (phone !== undefined) {
    if (!phone.trim()) {
      errors.push('Phone number cannot be empty');
    } else if (!validator.isMobilePhone(phone, 'any', { strictMode: false })) {
      errors.push('Invalid phone number format');
    }
  }

  // Street validation if provided
  if (street !== undefined) {
    if (!street.trim()) {
      errors.push('Street address cannot be empty');
    } else if (street.trim().length < 5) {
      errors.push('Street address must be at least 5 characters long');
    } else if (street.trim().length > 200) {
      errors.push('Street address must not exceed 200 characters');
    }
  }

  // City validation if provided
  if (city !== undefined) {
    if (!city.trim()) {
      errors.push('City cannot be empty');
    } else if (city.trim().length < 2) {
      errors.push('City must be at least 2 characters long');
    } else if (city.trim().length > 100) {
      errors.push('City must not exceed 100 characters');
    } else if (!/^[a-zA-Z\s]+$/.test(city.trim())) {
      errors.push('City can only contain letters and spaces');
    }
  }

  // State validation if provided
  if (state !== undefined) {
    if (!state.trim()) {
      errors.push('State cannot be empty');
    } else if (state.trim().length < 2) {
      errors.push('State must be at least 2 characters long');
    } else if (state.trim().length > 100) {
      errors.push('State must not exceed 100 characters');
    } else if (!/^[a-zA-Z\s]+$/.test(state.trim())) {
      errors.push('State can only contain letters and spaces');
    }
  }

  // Zip Code validation if provided
  if (zipCode !== undefined) {
    if (!zipCode.trim()) {
      errors.push('Zip code cannot be empty');
    } else if (!/^\d{5,6}$/.test(zipCode.trim())) {
      errors.push('Zip code must be 5 or 6 digits');
    }
  }

  // Country validation if provided
  if (country !== undefined && country.trim()) {
    if (country.trim().length < 2) {
      errors.push('Country must be at least 2 characters long');
    } else if (country.trim().length > 100) {
      errors.push('Country must not exceed 100 characters');
    } else if (!/^[a-zA-Z\s]+$/.test(country.trim())) {
      errors.push('Country can only contain letters and spaces');
    }
  }

  // Address Type validation if provided
  if (addressType !== undefined && !['home', 'work', 'other'].includes(addressType)) {
    errors.push('Address type must be one of: home, work, other');
  }

  // IsDefault validation if provided
  if (isDefault !== undefined && typeof isDefault !== 'boolean') {
    errors.push('isDefault must be a boolean value');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors
    });
  }

  next();
};

// Validate Address ID
const validateAddressId = (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      error: 'Invalid address ID format'
    });
  }

  next();
};

module.exports = {
  validateCreateAddress,
  validateUpdateAddress,
  validateAddressId
};