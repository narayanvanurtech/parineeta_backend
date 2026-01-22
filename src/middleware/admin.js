const jwt = require('jsonwebtoken');
const { User } = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-2024';

const generateAdminToken = (userId) => {
  return jwt.sign(
    { 
      id: userId, 
      type: 'admin' 
    }, 
    JWT_SECRET,
    { expiresIn: '24h' }
  );
};

const verifyAdminToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

const adminMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Access denied. No token provided.'
      });
    }
    
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        error: 'Access denied. Invalid token format.' 
      });
    }
    
    const decoded = jwt.verify(token, JWT_SECRET);
    
    const admin = await User.findById(decoded.id);
    if (!admin) {
      return res.status(401).json({ 
        error: 'User not found.' 
      });
    }
    
    if (admin.role !== 'admin') {
      return res.status(403).json({ 
        error: 'Admin access required.' 
      });
    }
    
    req.user = admin;
    next();
    
  } catch (error) {
    console.error('Admin Middleware Error:', error.message);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Invalid token.' 
      });
    }
    
    res.status(500).json({ 
      error: 'Admin authentication failed.' 
    });
  }
};

module.exports = {
  adminMiddleware,
  generateAdminToken,
  verifyAdminToken
};