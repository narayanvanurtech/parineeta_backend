const mongoose = require('mongoose');

// Validate User ID
const validateUserId = (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      error: 'Invalid user ID format'
    });
  }

  next();
};

module.exports = {
  validateUserId
};