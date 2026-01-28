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
    const { shippingAddress, cartItemIds } = req.body;

    if (!shippingAddress) {
      return res.status(400).json({
        error: "Shipping address is required",
      });
    }

    const address = await Address.findOne({
      _id: shippingAddress,
      userId,
    });

    if (!address) {
      return res.status(404).json({
        error: "Address not found",
      });
    }

    let cartItems;
    if (cartItemIds && Array.isArray(cartItemIds)) {
      cartItems = await Cart.find({
        userId,
        _id: { $in: cartItemIds },
      }).populate("productId");
    } else {
      cartItems = await Cart.find({ userId }).populate("productId");
    }

    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({
        error: "No items selected for order",
      });
    }

    const orderItems = [];
    let total = 0;

    for (const cartItem of cartItems) {
      const product = cartItem.productId;

      if (!product) {
        return res.status(400).json({
          error: "Product no longer exists",
        });
      }

      const variant = product.variants.id(cartItem.variantId);

      if (!variant) {
        return res.status(400).json({
          error: "Variant not found",
          product: product.name,
        });
      }

      if (variant.stock < cartItem.quantity) {
        return res.status(400).json({
          error: "Insufficient stock",
          product: product.name,
          color: variant.color,
          available: variant.stock,
          requested: cartItem.quantity,
        });
      }

      const subtotal = variant.price * cartItem.quantity;
      total += subtotal;

      orderItems.push({
        productId: product._id,
        variantId: variant._id,
        name: product.name,
        color: variant.color,
        price: variant.price,
        quantity: cartItem.quantity,
        image: variant.images?.[0] || "",
        subtotal,
      });

      await Product.updateOne(
        { _id: product._id, "variants._id": variant._id },
        { $inc: { "variants.$.stock": -cartItem.quantity } }
      );
    }

    // 🔹 Generate custom orderId / tracking number
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substring(2, 5);
    const orderId = `parineeta-${timestamp}-${randomPart}`;

    const order = new Order({
      userId,
      items: orderItems,
      total: Number(total.toFixed(2)),
      shippingAddress,
      paymentMethod: "COD",
      status: "pending",
      orderDate: new Date(),
      trackingNumber: orderId, // ✅ use custom ID
    });

    await order.save();

    if (cartItemIds && Array.isArray(cartItemIds)) {
      await Cart.deleteMany({ userId, _id: { $in: cartItemIds } });
    } else {
      await Cart.deleteMany({ userId });
    }

    res.status(201).json({
      message: "Order created successfully",
      order,
    });
  } catch (error) {
    console.error("Create Order Error:", error);
    res.status(500).json({
      error: "Failed to create order",
      details: error.message,
    });
  }
};



// Get all orders (Admin only)
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find({})
      .populate("userId", "name email")
      .populate("items.productId", "name category subcategory")
      .sort({ createdAt: -1 });

    const formattedOrders = orders.map((order) => ({
      _id: order._id,
      user: {
        _id: order.userId?._id,
        name: order.userId?.name,
        email: order.userId?.email,
      },
      items: order.items.map((item) => ({
        product: {
          _id: item.productId?._id,
          name: item.productId?.name,
          category: item.productId?.category,
          subcategory: item.productId?.subcategory,
        },
        variant: {
          _id: item.variantId,
          color: item.color,
          price: item.price,
          image: item.image,
        },
        quantity: item.quantity,
        subtotal: item.subtotal,
      })),
      total: order.total,
      paymentMethod: order.paymentMethod,
      status: order.status,
      trackingNumber: order.trackingNumber,
      shippingAddress: order.shippingAddress,
      orderDate: order.orderDate,
      createdAt: order.createdAt,
    }));

    res.json({
      message: "Orders retrieved successfully",
      totalOrders: formattedOrders.length,
      orders: formattedOrders,
    });
  } catch (error) {
    console.error("Get All Orders Error:", error);
    res.status(500).json({
      error: "Failed to retrieve orders",
    });
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