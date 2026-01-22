const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const admin = require('../middleware/admin');

console.log('📊 Admin routes loading...');

// DEBUG: Check what's in adminController
console.log('🔍 AdminController keys:', Object.keys(adminController));
console.log('🔍 getDashboardStats exists:', typeof adminController.getDashboardStats);

// All admin routes require admin authentication
router.use(admin.adminMiddleware);

// Dashboard and Analytics
router.get('/dashboard/stats', adminController.getDashboardStats);
router.get('/analytics/sales', adminController.getSalesAnalytics);
router.get('/analytics/users', adminController.getUserAnalytics);

// Revenue Reports
router.get('/reports/revenue', adminController.getRevenueReports);

// Bulk Operations
router.patch('/products/bulk-update', adminController.bulkUpdateProducts);
router.delete('/products/bulk-delete', adminController.bulkDeleteProducts);
router.patch('/orders/bulk-status', adminController.bulkUpdateOrderStatus); // NEW

// Reports
router.get('/reports/inventory', adminController.getInventoryReport);

console.log('✅ Admin routes defined');

module.exports = router;