const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-2024';

const generateUserToken = (userId) => {
  return jwt.sign(
    {
      id: userId,
      type: 'user'
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
};

const verifyUserToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

// The actual auth middleware function
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    console.log(token)
    if (!token) {
      return res.status(401).json({
        success: false,
        error: "admin No token provided"
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    const user = await User.findById(decoded.id || decoded.userId);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: "User not found"
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("❌ Auth middleware error:", error.message);
    return res.status(401).json({
      success: false,
      error: "Invalid token"
    });
  }
};

// Export the authMiddleware function directly as the default export
module.exports = authMiddleware;

// Also export the token functions if needed elsewhere
module.exports.generateUserToken = generateUserToken;
module.exports.verifyUserToken = verifyUserToken;
