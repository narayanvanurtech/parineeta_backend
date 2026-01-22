const { Order, Cart, Product, Address } = require('../config/db');

// Get user's orders
exports.getUserOrders = async (req, res) => {
  try {
    const userId = req.user._id;
    const orders = await Order.find({ userId })
      .populate('items.productId', 'name price images')
      .sort({ createdAt: -1 });

    res.json({
      message: 'Orders retrieved successfully',
      orders,
      total: orders.length
    });
  } catch (error) {
    console.error('Get User Orders Error:', error);
    res.status(500).json({ error: 'Failed to retrieve orders' });
  }
};

// Get order by ID
exports.getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    let order = await Order.findOne({ _id: id, userId: req.user._id })
      .populate('items.productId', 'name price images');

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({
      message: 'Order retrieved successfully',
      order
    });
  } catch (error) {
    console.error('Get Order Error:', error);
    res.status(500).json({ error: 'Failed to retrieve order' });
  }
};

// Create order
exports.createOrder = async (req, res) => {
  try {
    const userId = req.user._id;
    const { shippingAddress } = req.body;

    // Validate required fields
    if (!shippingAddress) {
      return res.status(400).json({ 
        error: 'Shipping address ID is required'
      });
    }

    // Verify the address exists and belongs to the user
    const address = await Address.findOne({
      _id: shippingAddress,
      userId: userId
    });

    if (!address) {
      return res.status(404).json({
        error: 'Address not found',
        details: 'The specified shipping address does not exist or does not belong to you'
      });
    }

    // Check cart items
    let cartItems;
    const { cartItemIds } = req.body; // Allow specific cart items to be ordered

    if (cartItemIds && Array.isArray(cartItemIds)) {
      cartItems = await Cart.find({
        userId,
        _id: { $in: cartItemIds }
      }).populate('productId');

      console.log('Requested cart items:', cartItemIds);
      console.log('Found cart items:', cartItems.map(item => item._id));

      if (cartItems.length !== cartItemIds.length) {
        const foundIds = cartItems.map(item => item._id.toString());
        const missingIds = cartItemIds.filter(id => !foundIds.includes(id));
        
        return res.status(400).json({ 
          error: 'One or more selected cart items were not found',
          details: {
            requestedIds: cartItemIds,
            foundIds: foundIds,
            missingIds: missingIds,
            userId: userId
          }
        });
      }
    } else {
      cartItems = await Cart.find({ userId }).populate('productId');
    }
    
    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({ error: 'No items selected for order' });
    }

    const orderItems = [];
    let total = 0;

    for (const cartItem of cartItems) {
      const product = cartItem.productId;
      
      // Check if product still exists
      if (!product) {
        return res.status(400).json({
          error: 'Some products in your cart are no longer available',
          item: cartItem
        });
      }

      // Check if product has sufficient stock
      if (product.stock < cartItem.quantity) {
        return res.status(400).json({
          error: 'Insufficient stock',
          product: product.name,
          requested: cartItem.quantity,
          available: product.stock
        });
      }

      orderItems.push({
        productId: product._id,
        name: product.name,
        price: product.price,
        quantity: cartItem.quantity,
        image: product.images && product.images.length > 0 ? product.images[0] : ''
      });

      total += product.price * cartItem.quantity;

      // Update product stock
      await Product.findByIdAndUpdate(product._id, {
        $inc: { stock: -cartItem.quantity }
      });
    }

    const order = new Order({
      userId,
      items: orderItems,
      total: parseFloat(total.toFixed(2)),
      shippingAddress,
      paymentMethod: 'COD', // Default to Cash on Delivery
      status: 'pending',
      orderDate: new Date(),
      trackingNumber: Math.random().toString(36).substring(7).toUpperCase()
    });

    await order.save();
    
    // Only delete the cart items that were ordered
    if (cartItemIds && Array.isArray(cartItemIds)) {
      await Cart.deleteMany({ _id: { $in: cartItemIds }, userId });
    } else {
      // If no specific items provided, clear entire cart
      await Cart.deleteMany({ userId });
    }

    res.status(201).json({
      message: 'Order created successfully',
      order: {
        _id: order._id,
        items: order.items,
        total: order.total,
        shippingAddress: order.shippingAddress,
        paymentMethod: order.paymentMethod,
        status: order.status,
        trackingNumber: order.trackingNumber,
        orderDate: order.orderDate
      }
    });
  } catch (error) {
    console.error('Create Order Error:', error);
    res.status(500).json({ 
      error: 'Failed to create order',
      details: error.message,
      type: error.name
    });
  }
};

// Get all orders (Admin only)
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find({})
      .populate('userId', 'name email')
      .populate('items.productId', 'name price')
      .sort({ createdAt: -1 });

    res.json({
      message: 'Orders retrieved successfully',
      orders,
      total: orders.length
    });
  } catch (error) {
    console.error('Get All Orders Error:', error);
    res.status(500).json({ error: 'Failed to retrieve orders' });
  }
};

// Update order status (Admin only)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status, updatedAt: new Date() },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({
      message: 'Order status updated successfully',
      order
    });
  } catch (error) {
    console.error('Update Order Error:', error);
    res.status(500).json({ error: 'Failed to update order' });
  }
};

// Cancel order (User can cancel pending/processing orders, Admin can cancel any)
exports.cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body; // Optional cancellation reason
    const userId = req.user._id;
    const isAdmin = req.user.role === 'admin';

    // Find the order
    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check if user owns this order (unless admin)
    if (!isAdmin && order.userId.toString() !== userId.toString()) {
      return res.status(403).json({ 
        error: 'You are not authorized to cancel this order' 
      });
    }

    // Check if order is already cancelled
    if (order.status === 'cancelled') {
      return res.status(400).json({ 
        error: 'Order is already cancelled' 
      });
    }

    // Check if order can be cancelled (users can only cancel pending/processing orders)
    if (!isAdmin && !['pending', 'processing'].includes(order.status)) {
      return res.status(400).json({ 
        error: `Cannot cancel order with status: ${order.status}. Only pending or processing orders can be cancelled.` 
      });
    }

    // If order is shipped or delivered, only admin can cancel
    if (!isAdmin && ['shipped', 'delivered'].includes(order.status)) {
      return res.status(400).json({ 
        error: 'Cannot cancel shipped or delivered orders. Please contact support.' 
      });
    }

    // Update order status
    order.status = 'cancelled';
    order.cancellationReason = reason || 'Cancelled by user';
    order.cancelledAt = new Date();
    order.cancelledBy = isAdmin ? 'admin' : 'user';
    
    await order.save();

    res.json({
      message: 'Order cancelled successfully',
      order: {
        _id: order._id,
        status: order.status,
        cancellationReason: order.cancellationReason,
        cancelledAt: order.cancelledAt,
        total: order.total
      }
    });

  } catch (error) {
    console.error('Cancel Order Error:', error);
    res.status(500).json({ 
      error: 'Failed to cancel order',
      details: error.message 
    });
  }
};