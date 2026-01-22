const express = require('express');
const cors = require('cors');

const apiRoutes = require('./src/routes/index');

const app = express();

// Middleware
app.use(cors({
  origin: "http://localhost:8080", 
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
  
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  next();
});

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to E-commerce API with PhonePe Payment Integration',
    version: '2.0.0',
    availableRoutes: {
      health: '/api/health',
      auth: '/api/auth',
      authMe: '/api/auth/me',
      products: '/api/products',
      orders: '/api/orders',
      cart: '/api/cart',
      categories: '/api/categories',
      subtitle:'/api/subtitles',
      users: '/api/users',
      address: '/api/address',
      wishlist: '/api/wishlist',
      payments: '/api/payments' 
    },
    paymentIntegration: { 
      gateway: 'PhonePe',
      mode: process.env.PHONEPE_MODE || 'SANDBOX',
      cronJobs: 'Active'
    }
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    uptime: process.uptime(), 
    timestamp: new Date(),
    environment: process.env.NODE_ENV,
    paymentGateway: { // ADD THIS BLOCK
      provider: 'PhonePe',
      mode: process.env.PHONEPE_MODE || 'SANDBOX',
      configured: !!(process.env.PHONEPE_MERCHANT_ID && process.env.PHONEPE_SALT_KEY)
    }
  });
});

// Mount API routes
app.use('/api', apiRoutes);

// 404 Error Handler
app.use((req, res, next) => {
  res.status(404).json({ 
    error: 'Route not found', 
    path: req.originalUrl,
    method: req.method,
    availableEndpoints: [
      '/api/health',
      '/api/auth/register',
      '/api/auth/me',
      '/api/auth/login',
      '/api/auth/logout',
      '/api/products',
      '/api/orders',
      '/api/cart',
      '/api/categories',
      '/api/subtitles',
      '/api/users',
      '/api/address',
      '/api/wishlist',
      '/api/payments' 
    ]
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Error Stack:', err.stack);
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({ 
      error: 'Validation Error', 
      details: err.message 
    });
  }
  
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ 
      error: 'Invalid token' 
    });
  }
  
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

module.exports = app;