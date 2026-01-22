const { User, Product, Order, Category } = require('../config/db');

//  admin dashboard statistics
exports.getDashboardStats = async (req, res) => {
  try {
    console.log(' Dashboard stats called');
    
    // Simple counts for testing
    const totalUsers = await User.countDocuments({ role: 'customer' });
    const totalProducts = await Product.countDocuments();
    const totalOrders = await Order.countDocuments();
    const totalCategories = await Category.countDocuments();
    const pendingOrders = await Order.countDocuments({ status: 'pending' });
    const lowStockProducts = await Product.countDocuments({ stock: { $lt: 10 } });

    res.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          totalProducts,
          totalOrders,
          totalCategories,
          pendingOrders,
          lowStockProducts,
          totalRevenue: 0,
          monthlyRevenue: 0
        },
        orderStatusBreakdown: [
          { _id: 'pending', count: pendingOrders },
          { _id: 'processing', count: 0 },
          { _id: 'shipped', count: 0 },
          { _id: 'delivered', count: totalOrders - pendingOrders }
        ],
        recentOrders: [],
        topSellingProducts: []
      }
    });

  } catch (error) {
    console.error('Get Dashboard Stats Error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to retrieve dashboard statistics' 
    });
  }
};

// Get comprehensive sales analytics - FIXED VERSION
exports.getSalesAnalytics = async (req, res) => {
  try {
    const { period = 'monthly', startDate, endDate } = req.query;
    
    console.log('📈 Sales analytics requested:', { period, startDate, endDate });

    let dateFormat, matchStage = { status: 'delivered' }; // Only delivered orders for sales

    // Set date format based on period
    switch (period) {
      case 'daily':
        dateFormat = '%Y-%m-%d';
        break;
      case 'weekly':
        dateFormat = '%Y-%U';
        break;
      case 'yearly':
        dateFormat = '%Y';
        break;
      default: // monthly
        dateFormat = '%Y-%m';
    }

    // Date range filter
    if (startDate && endDate) {
      matchStage.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else {
      // Default ranges based on period
      const defaultEndDate = new Date();
      const defaultStartDate = new Date();
      
      switch (period) {
        case 'daily':
          defaultStartDate.setDate(defaultEndDate.getDate() - 30);
          break;
        case 'weekly':
          defaultStartDate.setDate(defaultEndDate.getDate() - 90);
          break;
        case 'yearly':
          defaultStartDate.setFullYear(defaultEndDate.getFullYear() - 2);
          break;
        default: // monthly
          defaultStartDate.setFullYear(defaultEndDate.getFullYear() - 1);
      }
      
      matchStage.createdAt = { 
        $gte: defaultStartDate,
        $lte: defaultEndDate
      };
    }

    console.log('📅 Sales analytics date filter:', matchStage.createdAt);

    // SALES TRENDS DATA
    const salesTrends = await Order.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: { 
            $dateToString: { 
              format: dateFormat, 
              date: '$createdAt' 
            }
          },
          totalSales: { $sum: '$total' },
          orderCount: { $sum: 1 },
          averageOrderValue: { $avg: '$total' },
          uniqueCustomers: { $addToSet: '$userId' }
        }
      },
      {
        $project: {
          period: '$_id',
          totalSales: 1,
          orderCount: 1,
          averageOrderValue: { $round: ['$averageOrderValue', 2] },
          uniqueCustomers: { $size: '$uniqueCustomers' }
        }
      },
      { $sort: { period: 1 } }
    ]);

    // PRODUCT PERFORMANCE
    const productPerformance = await Order.aggregate([
      { $match: matchStage },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.productId',
          productName: { $first: '$items.name' },
          totalUnitsSold: { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
          averagePrice: { $avg: '$items.price' },
          orderCount: { $addToSet: '$_id' }
        }
      },
      {
        $project: {
          productName: 1,
          totalUnitsSold: 1,
          totalRevenue: 1,
          averagePrice: { $round: ['$averagePrice', 2] },
          orderCount: { $size: '$orderCount' }
        }
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 10 }
    ]);

    // CATEGORY PERFORMANCE - SIMPLIFIED VERSION
    const categoryPerformance = await Order.aggregate([
      { $match: matchStage },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'products',
          localField: 'items.productId',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      {
        $group: {
          _id: '$product.category',
          totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
          totalUnitsSold: { $sum: '$items.quantity' },
          averagePrice: { $avg: '$items.price' },
          uniqueProducts: { $addToSet: '$items.productId' },
          orderCount: { $addToSet: '$_id' }
        }
      },
      {
        $project: {
          category: '$_id',
          totalRevenue: 1,
          totalUnitsSold: 1,
          averagePrice: { $round: ['$averagePrice', 2] },
          uniqueProductsCount: { $size: '$uniqueProducts' },
          orderCount: { $size: '$orderCount' }
        }
      },
      { $sort: { totalRevenue: -1 } }
    ]);

    // Calculate market share separately (fixes the aggregation error)
    const totalCategoryRevenue = categoryPerformance.reduce((sum, cat) => sum + cat.totalRevenue, 0);
    const categoriesWithShare = categoryPerformance.map(cat => ({
      ...cat,
      marketShare: totalCategoryRevenue > 0 ? 
        Number(((cat.totalRevenue / totalCategoryRevenue) * 100).toFixed(2)) : 0
    }));

    // CUSTOMER BEHAVIOR ANALYTICS - SIMPLIFIED
    const customerStats = await Order.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$userId',
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: '$total' }
        }
      },
      {
        $group: {
          _id: null,
          totalCustomers: { $sum: 1 },
          averageOrdersPerCustomer: { $avg: '$totalOrders' },
          averageCustomerValue: { $avg: '$totalSpent' },
          repeatCustomers: {
            $sum: {
              $cond: [{ $gt: ['$totalOrders', 1] }, 1, 0]
            }
          }
        }
      }
    ]);

    const customerBehavior = customerStats[0] ? {
      totalCustomers: customerStats[0].totalCustomers,
      averageOrdersPerCustomer: Number(customerStats[0].averageOrdersPerCustomer.toFixed(2)),
      averageCustomerValue: Number(customerStats[0].averageCustomerValue.toFixed(2)),
      repeatCustomerRate: customerStats[0].totalCustomers > 0 ? 
        Number(((customerStats[0].repeatCustomers / customerStats[0].totalCustomers) * 100).toFixed(2)) : 0
    } : {
      totalCustomers: 0,
      averageOrdersPerCustomer: 0,
      averageCustomerValue: 0,
      repeatCustomerRate: 0
    };

    // Calculate summary statistics
    const summary = salesTrends.reduce((stats, period) => ({
      totalSales: stats.totalSales + period.totalSales,
      totalOrders: stats.totalOrders + period.orderCount
    }), { totalSales: 0, totalOrders: 0 });

    res.json({
      success: true,
      data: {
        period,
        dateRange: {
          startDate: matchStage.createdAt.$gte,
          endDate: matchStage.createdAt.$lte
        },
        summary: {
          totalSales: summary.totalSales,
          totalOrders: summary.totalOrders,
          averageOrderValue: summary.totalOrders > 0 ? 
            Number((summary.totalSales / summary.totalOrders).toFixed(2)) : 0,
          totalProducts: productPerformance.length,
          totalCategories: categoriesWithShare.length
        },
        salesTrends,
        productPerformance,
        categoryPerformance: categoriesWithShare,
        customerBehavior,
        insights: {
          topProduct: productPerformance[0] || null,
          topCategory: categoriesWithShare[0] || null,
          bestPeriod: salesTrends.reduce((best, current) => 
            current.totalSales > (best?.totalSales || 0) ? current : best, null
          )
        }
      }
    });

  } catch (error) {
    console.error('📈 Get Sales Analytics Error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to retrieve sales analytics',
      details: error.message 
    });
  }
};

// Get user analytics
exports.getUserAnalytics = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'customer' });
    
    res.json({
      success: true,
      data: {
        userGrowth: [],
        totalUsers: totalUsers
      }
    });
  } catch (error) {
    console.error('Get User Analytics Error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to retrieve user analytics' 
    });
  }
};

// Bulk update products - REAL IMPLEMENTATION
exports.bulkUpdateProducts = async (req, res) => {
  try {
    const { productIds, updateData } = req.body;

    console.log(' Bulk update request:', { productIds, updateData });

    // Validation
    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Product IDs array is required and cannot be empty'
      });
    }

    if (!updateData || typeof updateData !== 'object' || Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Update data object is required and cannot be empty'
      });
    }

    // Validate that updateData contains only allowed fields
    const allowedFields = ['name', 'price', 'description', 'category', 'stock', 'sizes', 'colors', 'featured'];
    const invalidFields = Object.keys(updateData).filter(field => !allowedFields.includes(field));
    
    if (invalidFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Invalid fields in update data: ${invalidFields.join(', ')}`,
        allowedFields: allowedFields
      });
    }

    //  bulk update
    const result = await Product.updateMany(
      { _id: { $in: productIds } },
      { 
        $set: { 
          ...updateData, 
          updatedAt: new Date() 
        } 
      }
    );

    console.log(' Bulk update result:', result);

    res.json({
      success: true,
      message: `${result.modifiedCount} products updated successfully`,
      data: {
        modifiedCount: result.modifiedCount,
        matchedCount: result.matchedCount
      }
    });

  } catch (error) {
    console.error(' Bulk Update Products Error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to bulk update products',
      details: error.message 
    });
  }
};

// Bulk delete products
exports.bulkDeleteProducts = async (req, res) => {
  try {
    const { productIds } = req.body;

    console.log(' Bulk delete request:', { productIds });

    // Validation
    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Product IDs array is required and cannot be empty'
      });
    }

    // Get products before deletion for image cleanup and response
    const productsToDelete = await Product.find({ _id: { $in: productIds } });
    
    // Delete associated images from filesystem
    const fs = require('fs');
    const path = require('path');
    
    productsToDelete.forEach(product => {
      if (product.images && product.images.length > 0) {
        product.images.forEach(imagePath => {
          try {
            const fullPath = path.join(__dirname, '../../', imagePath.replace(/^\//, ''));
            if (fs.existsSync(fullPath)) {
              fs.unlinkSync(fullPath);
              console.log(` Deleted image: ${imagePath}`);
            }
          } catch (error) {
            console.error(` Error deleting image ${imagePath}:`, error.message);
          }
        });
      }
    });

    // Perform the actual bulk deletion
    const result = await Product.deleteMany({ _id: { $in: productIds } });

    console.log(' Bulk delete result:', result);

    res.json({
      success: true,
      message: `${result.deletedCount} products deleted successfully`,
      data: {
        deletedCount: result.deletedCount,
        deletedProducts: productsToDelete.map(product => ({
          id: product._id,
          name: product.name,
          imagesDeleted: product.images ? product.images.length : 0
        }))
      }
    });

  } catch (error) {
    console.error(' Bulk Delete Products Error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to bulk delete products',
      details: error.message 
    });
  }
};

// Revenue reports by period 
exports.getRevenueReports = async (req, res) => {
  try {
    const { period = 'monthly', startDate, endDate } = req.query;
    
    console.log(' Revenue report requested:', { period, startDate, endDate });

    let dateFormat, matchStage = { status: 'delivered' };

    // Set date format based on period
    switch (period) {
      case 'daily':
        dateFormat = '%Y-%m-%d';
        break;
      case 'weekly':
        dateFormat = '%Y-%U'; 
        break;
      case 'yearly':
        dateFormat = '%Y';
        break;
      default: 
        dateFormat = '%Y-%m';
    }

   
    if (startDate && endDate) {
      matchStage.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else {
      
      const defaultEndDate = new Date();
      const defaultStartDate = new Date();
      
      // Set start date based on period
      switch (period) {
        case 'daily':
          defaultStartDate.setDate(defaultEndDate.getDate() - 30); // Last 30 days
          break;
        case 'weekly':
          defaultStartDate.setDate(defaultEndDate.getDate() - 90); // Last 90 days
          break;
        case 'yearly':
          defaultStartDate.setFullYear(defaultEndDate.getFullYear() - 2); // Last 2 years
          break;
        default: // monthly
          defaultStartDate.setFullYear(defaultEndDate.getFullYear() - 1); // Last 12 months
      }
      
      matchStage.createdAt = { 
        $gte: defaultStartDate,
        $lte: defaultEndDate
      };
    }

    console.log(' Date filter:', matchStage.createdAt);

    const revenueData = await Order.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: { 
            $dateToString: { 
              format: dateFormat, 
              date: '$createdAt' 
            }
          },
          totalRevenue: { $sum: '$total' },
          orderCount: { $sum: 1 },
          averageOrderValue: { $avg: '$total' },
          minOrderValue: { $min: '$total' },
          maxOrderValue: { $max: '$total' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Calculate overall totals
    const overallStats = await Order.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$total' },
          totalOrders: { $sum: 1 },
          averageOrderValue: { $avg: '$total' }
        }
      }
    ]);

    
    const dateRangeUsed = await Order.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          minDate: { $min: '$createdAt' },
          maxDate: { $max: '$createdAt' }
        }
      }
    ]);

    const dateRange = dateRangeUsed[0] || {};
    
    res.json({
      success: true,
      data: {
        period,
        dateRange: {
          startDate: dateRange.minDate ? dateRange.minDate.toISOString().split('T')[0] : 'No data',
          endDate: dateRange.maxDate ? dateRange.maxDate.toISOString().split('T')[0] : 'No data',
          appliedFilter: matchStage.createdAt
        },
        revenueData,
        overallStats: overallStats[0] || {
          totalRevenue: 0,
          totalOrders: 0,
          averageOrderValue: 0
        },
        note: revenueData.length === 0 ? 'No revenue data found for the selected period. Make sure you have delivered orders.' : null
      }
    });

  } catch (error) {
    console.error(' Get Revenue Reports Error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to retrieve revenue reports',
      details: error.message 
    });
  }
};

// Bulk update order status
exports.bulkUpdateOrderStatus = async (req, res) => {
  try {
    const { orderIds, status, notes } = req.body;

    console.log(' Bulk order status update:', { orderIds, status, notes });

    // Validation
    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Order IDs array is required and cannot be empty'
      });
    }

    if (!status || typeof status !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Status is required and must be a string'
      });
    }

    // Validate status value
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    // Perform the bulk update
    const result = await Order.updateMany(
      { _id: { $in: orderIds } },
      { 
        $set: { 
          status: status,
          updatedAt: new Date(),
          ...(notes && { adminNotes: notes })
        } 
      }
    );

    console.log(' Bulk order update result:', result);

    // Get updated orders for response
    const updatedOrders = await Order.find({ _id: { $in: orderIds } })
      .select('_id orderNumber status total userId')
      .populate('userId', 'firstName lastName email');

    res.json({
      success: true,
      message: `${result.modifiedCount} orders updated to "${status}" successfully`,
      data: {
        modifiedCount: result.modifiedCount,
        matchedCount: result.matchedCount,
        updatedOrders: updatedOrders.map(order => ({
          id: order._id,
          orderNumber: order.orderNumber,
          status: order.status,
          total: order.total,
          customer: order.userId ? {
            name: `${order.userId.firstName} ${order.userId.lastName}`,
            email: order.userId.email
          } : null
        }))
      }
    });

  } catch (error) {
    console.error(' Bulk Update Order Status Error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to bulk update order status',
      details: error.message 
    });
  }
};

// Inventory report
// Comprehensive inventory report
exports.getInventoryReport = async (req, res) => {
  try {
    const { lowStockThreshold = 10, includeOutOfStock = 'true' } = req.query;
    
    console.log('📦 Inventory report requested:', { lowStockThreshold, includeOutOfStock });

    const threshold = parseInt(lowStockThreshold);

    // Build filter for low stock products
    let lowStockFilter = { stock: { $lt: threshold, $gt: 0 } };
    
    // Include out of stock if requested
    if (includeOutOfStock === 'true') {
      lowStockFilter = { 
        $or: [
          { stock: { $lt: threshold, $gt: 0 } }, // Low stock but not zero
          { stock: { $eq: 0 } } // Out of stock
        ]
      };
    }

    // Get low stock products with detailed information
    const lowStockProducts = await Product.find(lowStockFilter)
      .select('name price stock images category sizes colors createdAt')
      .sort({ stock: 1 });

    // Calculate comprehensive inventory statistics
    const inventoryStats = await Product.aggregate([
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          totalStockValue: { 
            $sum: { $multiply: ['$price', '$stock'] } 
          },
          totalStockUnits: { $sum: '$stock' },
          averageStock: { $avg: '$stock' },
          outOfStock: { 
            $sum: { $cond: [{ $eq: ['$stock', 0] }, 1, 0] } 
          },
          lowStock: { 
            $sum: { 
              $cond: [
                { $and: [{ $gt: ['$stock', 0] }, { $lte: ['$stock', threshold] }] }, 
                1, 0 
              ] 
            } 
          },
          healthyStock: { 
            $sum: { 
              $cond: [{ $gt: ['$stock', threshold] }, 1, 0] 
            } 
          },
          // Price analysis
          highestPricedProduct: { $max: '$price' },
          lowestPricedProduct: { $min: '$price' },
          averageProductPrice: { $avg: '$price' },
          // Stock value analysis
          highestStockValue: { 
            $max: { $multiply: ['$price', '$stock'] } 
          },
          lowestStockValue: { 
            $min: { $multiply: ['$price', '$stock'] } 
          }
        }
      }
    ]);

    // Get category-wise inventory breakdown
    const categoryBreakdown = await Product.aggregate([
      {
        $group: {
          _id: '$category',
          productCount: { $sum: 1 },
          totalStock: { $sum: '$stock' },
          totalValue: { $sum: { $multiply: ['$price', '$stock'] } },
          averageStock: { $avg: '$stock' },
          outOfStock: { $sum: { $cond: [{ $eq: ['$stock', 0] }, 1, 0] } },
          lowStock: { 
            $sum: { 
              $cond: [
                { $and: [{ $gt: ['$stock', 0] }, { $lte: ['$stock', threshold] }] }, 
                1, 0 
              ] 
            } 
          }
        }
      },
      { $sort: { totalValue: -1 } }
    ]);

    // Get products that need immediate attention (stock = 0)
    const outOfStockProducts = await Product.find({ stock: 0 })
      .select('name price category createdAt')
      .sort({ createdAt: -1 });

    // Get recently updated products (last 7 days)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const recentlyUpdatedProducts = await Product.find({
      updatedAt: { $gte: oneWeekAgo }
    })
    .select('name price stock previousStock category updatedAt')
    .sort({ updatedAt: -1 })
    .limit(10);

    const stats = inventoryStats[0] || {};

    res.json({
      success: true,
      data: {
        summary: {
          lowStockThreshold: threshold,
          includeOutOfStock: includeOutOfStock === 'true',
          reportGenerated: new Date().toISOString()
        },
        inventoryStats: {
          // Basic counts
          totalProducts: stats.totalProducts || 0,
          totalStockUnits: stats.totalStockUnits || 0,
          totalStockValue: Number((stats.totalStockValue || 0).toFixed(2)),
          averageStock: Number((stats.averageStock || 0).toFixed(1)),
          
          // Stock status breakdown
          stockStatus: {
            outOfStock: stats.outOfStock || 0,
            lowStock: stats.lowStock || 0,
            healthyStock: stats.healthyStock || 0
          },
          
          // Price analysis
          priceAnalysis: {
            highestPriced: Number((stats.highestPricedProduct || 0).toFixed(2)),
            lowestPriced: Number((stats.lowestPricedProduct || 0).toFixed(2)),
            averagePrice: Number((stats.averageProductPrice || 0).toFixed(2))
          },
          
          // Stock value analysis
          valueAnalysis: {
            highestStockValue: Number((stats.highestStockValue || 0).toFixed(2)),
            lowestStockValue: Number((stats.lowestStockValue || 0).toFixed(2))
          }
        },
        categoryBreakdown,
        products: {
          lowStock: lowStockProducts,
          outOfStock: outOfStockProducts,
          recentlyUpdated: recentlyUpdatedProducts
        },
        alerts: {
          critical: stats.outOfStock || 0,
          warning: stats.lowStock || 0,
          totalAlerts: (stats.outOfStock || 0) + (stats.lowStock || 0)
        }
      }
    });

  } catch (error) {
    console.error('📦 Get Inventory Report Error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to retrieve inventory report',
      details: error.message 
    });
  }
};