const { Order, Cart, Product, Address } = require('../config/db');
const {
  createDelhiveryShipment,
  trackDelhiveryShipment,
  cancelDelhiveryShipment,
  getDelhiveryWarehouses
} = require('../services/deliveryService');

// ============================================================
// 💳 PAYMENT INTEGRATION — UNCOMMENT WHEN READY
// ============================================================
// const Razorpay = require('razorpay');
// const crypto = require('crypto');
//
// const razorpay = new Razorpay({
//   key_id: process.env.RAZORPAY_KEY_ID,
//   key_secret: process.env.RAZORPAY_KEY_SECRET,
// });
//
// // ── CREATE RAZORPAY ORDER (call before placing order) ──────
// exports.createPaymentOrder = async (req, res) => {
//   try {
//     const { amount } = req.body; // amount in INR
//     const options = {
//       amount: Math.round(amount * 100), // convert to paise
//       currency: 'INR',
//       receipt: `receipt_${Date.now()}`,
//     };
//     const paymentOrder = await razorpay.orders.create(options);
//     res.json({ success: true, paymentOrder });
//   } catch (error) {
//     console.error('Create Payment Order Error:', error);
//     res.status(500).json({ error: 'Failed to create payment order' });
//   }
// };
//
// // ── VERIFY RAZORPAY PAYMENT SIGNATURE ─────────────────────
// exports.verifyPayment = async (req, res) => {
//   try {
//     const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
//     const body = razorpay_order_id + '|' + razorpay_payment_id;
//     const expectedSignature = crypto
//       .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
//       .update(body)
//       .digest('hex');
//     if (expectedSignature !== razorpay_signature) {
//       return res.status(400).json({ error: 'Payment verification failed' });
//     }
//     res.json({ success: true, message: 'Payment verified successfully' });
//   } catch (error) {
//     console.error('Verify Payment Error:', error);
//     res.status(500).json({ error: 'Failed to verify payment' });
//   }
// };
// ============================================================


// ─────────────────────────────────────────────
// ✅ GET: All orders for logged-in user
// ─────────────────────────────────────────────
exports.getUserOrders = async (req, res) => {
  try {
    const userId = req.user._id;

    const orders = await Order.find({ userId })
      .populate('items.productId', 'name price images')
      .sort({ createdAt: -1 });

    res.json({
      message: 'Orders retrieved successfully',
      orders,
      total: orders.length,
    });
  } catch (error) {
    console.error('Get User Orders Error:', error);
    res.status(500).json({ error: 'Failed to retrieve orders' });
  }
};


// ─────────────────────────────────────────────
// ✅ GET: Single order by ID (user's own)
// ─────────────────────────────────────────────
exports.getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findOne({ _id: id, userId: req.user._id }).populate(
      'items.productId',
      'name price images'
    );

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({ message: 'Order retrieved successfully', order });
  } catch (error) {
    console.error('Get Order Error:', error);
    res.status(500).json({ error: 'Failed to retrieve order' });
  }
};


// ─────────────────────────────────────────────
// ✅ POST: Create a new order (COD + Delhivery)
// ─────────────────────────────────────────────
exports.createOrder = async (req, res) => {
  try {
    const userId = req.user._id;
    const { shippingAddress, cartItemIds } = req.body;

    // ── Validate shipping address ──────────────
    if (!shippingAddress) {
      return res.status(400).json({ error: 'Shipping address is required' });
    }

    const address = await Address.findOne({ _id: shippingAddress, userId });
    if (!address) {
      return res.status(404).json({ error: 'Address not found' });
    }

    // ============================================================
    // 💳 PAYMENT VERIFICATION — UNCOMMENT WHEN READY
    // ============================================================
    // const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    //
    // if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    //   return res.status(400).json({ error: 'Payment details are required' });
    // }
    //
    // const body = razorpay_order_id + '|' + razorpay_payment_id;
    // const expectedSignature = crypto
    //   .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    //   .update(body)
    //   .digest('hex');
    //
    // if (expectedSignature !== razorpay_signature) {
    //   return res.status(400).json({ error: 'Invalid payment. Order blocked.' });
    // }
    // console.log('✅ Payment verified');
    // ============================================================

    // ── Fetch cart items ───────────────────────
    let cartItems;
    if (cartItemIds && Array.isArray(cartItemIds) && cartItemIds.length > 0) {
      cartItems = await Cart.find({ userId, _id: { $in: cartItemIds } }).populate('productId');
    } else {
      cartItems = await Cart.find({ userId }).populate('productId');
    }

    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({ error: 'No items selected for order' });
    }

    console.log('CartItems count:', cartItems.length);

    // ── Build order items & validate stock ─────
    const orderItems = [];
    let total = 0;

    for (const cartItem of cartItems) {
      const product = cartItem.productId;

      // Auto-cleanup stale cart items (deleted products)
      if (!product || !product._id) {
        console.warn('⚠️ Stale cart item removed:', cartItem._id);
        await Cart.deleteOne({ _id: cartItem._id });
        continue;
      }

      // Find the correct variant
      const variant = product.variants?.find(
        (v) => v._id.toString() === cartItem.variantId?.toString()
      );

      if (!variant) {
        console.warn('⚠️ Variant not found, removing cart item:', cartItem._id);
        await Cart.deleteOne({ _id: cartItem._id });
        continue;
      }

      // Find the correct size
      const selectedSizeId = cartItem.size?._id;
      const sizeObj = selectedSizeId
        ? variant.sizes?.find((s) => s._id.toString() === selectedSizeId.toString())
        : null;

      // Resolve price & stock (size-level or variant-level)
      const stock = sizeObj ? sizeObj.stock : variant.stock;
      const price = sizeObj ? sizeObj.finalPrice ?? sizeObj.price : variant.price;
      const sizeName = sizeObj ? sizeObj.size : null;

      if (stock == null) {
        return res.status(400).json({
          error: 'Stock information unavailable',
          product: product.name,
        });
      }

      if (stock < cartItem.quantity) {
        return res.status(400).json({
          error: 'Insufficient stock',
          product: product.name,
          color: variant.color,
          size: sizeName,
          available: stock,
          requested: cartItem.quantity,
        });
      }

      const subtotal = price * cartItem.quantity;
      total += subtotal;

      orderItems.push({
        productId: product._id,
        variantId: variant._id,
        name: product.name,
        color: variant.color,
        size: sizeName,
        price,
        quantity: cartItem.quantity,
        image: variant.images?.[0] || '',
        subtotal,
      });

      // ── Decrement stock ────────────────────────
      if (sizeObj && selectedSizeId) {
        await Product.updateOne(
          { _id: product._id, 'variants._id': variant._id },
          { $inc: { 'variants.$[v].sizes.$[s].stock': -cartItem.quantity } },
          { arrayFilters: [{ 'v._id': variant._id }, { 's._id': selectedSizeId }] }
        );
      } else {
        await Product.updateOne(
          { _id: product._id, 'variants._id': variant._id },
          { $inc: { 'variants.$.stock': -cartItem.quantity } }
        );
      }
    }

    // Guard: all items were stale
    if (orderItems.length === 0) {
      return res.status(400).json({
        error: 'No valid items found. Some products may no longer be available.',
      });
    }

    // ── Generate unique order ID ───────────────
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substring(2, 5);
    const orderId = `parineeta-${timestamp}-${randomPart}`;

    // ── Save order to DB ───────────────────────
    const order = new Order({
      userId,
      items: orderItems,
      total: Number(total.toFixed(2)),
      shippingAddress,
      paymentMethod: 'COD',         // 🔁 change to 'Online' when payment is live
      paymentStatus: 'pending',     // 💳 set to 'paid' after Razorpay verification
      status: 'pending',
      orderDate: new Date(),
      trackingNumber: orderId,

      // 💳 Payment fields — uncomment when payment is live
      // razorpayOrderId: razorpay_order_id,
      // razorpayPaymentId: razorpay_payment_id,
      // paidAt: new Date(),
    });

    await order.save();

    // ── Create shipment on Delhivery One ───────
    try {
      const { waybill, rawResponse } = await createDelhiveryShipment({
        orderId,
        address,
        orderItems,
        total: Number(total.toFixed(2)),
        paymentMethod: 'COD',       // 🔁 swap to 'Prepaid' when online payment is live
      });

      console.log("waybill",waybill)
      console.log("rawResponse",rawResponse)

      order.awbNumber = waybill;
      order.delhiveryWaybill = waybill;
      order.delhiveryRaw = rawResponse;
      await order.save();

      console.log('✅ Delhivery shipment created. Waybill:', waybill);
    } catch (delhiveryErr) {
      // Don't block order creation if Delhivery fails
      console.error('⚠️ Delhivery Shipment Error:', {
        message: delhiveryErr.message,
        status: delhiveryErr.response?.status,
        data: delhiveryErr.response?.data,
      });
    }

    // ── Clear cart ─────────────────────────────
    if (cartItemIds && Array.isArray(cartItemIds) && cartItemIds.length > 0) {
      await Cart.deleteMany({ userId, _id: { $in: cartItemIds } });
    } else {
      await Cart.deleteMany({ userId });
    }

    res.status(201).json({
      message: 'Order created successfully',
      order,
    });
  } catch (error) {
    console.error('Create Order Error:', error);
    res.status(500).json({ error: 'Failed to create order', details: error.message });
  }
};


// ─────────────────────────────────────────────
// ✅ GET: All orders — Admin only
// ─────────────────────────────────────────────
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find({})
      .populate('userId', 'name email')
      .populate('items.productId', 'name category subcategory')
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
        size: item.size,
        quantity: item.quantity,
        subtotal: item.subtotal,
      })),
      total: order.total,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      status: order.status,
      trackingNumber: order.trackingNumber,
      delhiveryWaybill: order.delhiveryWaybill,
      awbNumber: order.awbNumber,
      shippingAddress: order.shippingAddress,
      orderDate: order.orderDate,
      createdAt: order.createdAt,
    }));

    res.json({
      message: 'Orders retrieved successfully',
      totalOrders: formattedOrders.length,
      orders: formattedOrders,
    });
  } catch (error) {
    console.error('Get All Orders Error:', error);
    res.status(500).json({ error: 'Failed to retrieve orders' });
  }
};


// ─────────────────────────────────────────────
// ✅ PATCH: Update order status — Admin only
// ─────────────────────────────────────────────
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const allowedStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        error: `Invalid status. Must be one of: ${allowedStatuses.join(', ')}`,
      });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status, updatedAt: new Date() },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({ message: 'Order status updated successfully', order });
  } catch (error) {
    console.error('Update Order Error:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
};


// ─────────────────────────────────────────────
// ✅ PATCH: Cancel order (user or admin)
// ─────────────────────────────────────────────
exports.cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user._id;
    const isAdmin = req.user.role === 'admin';

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Authorization check
    if (!isAdmin && order.userId.toString() !== userId.toString()) {
      return res.status(403).json({ error: 'You are not authorized to cancel this order' });
    }

    if (order.status === 'cancelled') {
      return res.status(400).json({ error: 'Order is already cancelled' });
    }

    // Users can only cancel pending or processing orders
    if (!isAdmin && !['pending', 'processing'].includes(order.status)) {
      return res.status(400).json({
        error: `Cannot cancel order with status: ${order.status}. Please contact support.`,
      });
    }

    // Update order
    order.status = 'cancelled';
    order.cancellationReason = reason || 'Cancelled by user';
    order.cancelledAt = new Date();
    order.cancelledBy = isAdmin ? 'admin' : 'user';
    await order.save();

    // ── Cancel on Delhivery One ────────────────
    if (order.awbNumber) {
      try {
        await cancelDelhiveryShipment(order.awbNumber);
        console.log('✅ Delhivery shipment cancelled. Waybill:', order.awbNumber);
      } catch (err) {
        console.error('⚠️ Delhivery Cancel Error:', err.response?.data || err.message);
      }
    }

    // ============================================================
    // 💳 RAZORPAY REFUND — UNCOMMENT WHEN PAYMENT IS LIVE
    // ============================================================
    // if (order.paymentMethod === 'Online' && order.razorpayPaymentId) {
    //   try {
    //     const refund = await razorpay.payments.refund(order.razorpayPaymentId, {
    //       amount: Math.round(order.total * 100), // paise
    //       notes: { reason: order.cancellationReason },
    //     });
    //     order.refundId = refund.id;
    //     order.paymentStatus = 'refunded';
    //     await order.save();
    //     console.log('✅ Razorpay refund initiated:', refund.id);
    //   } catch (refundErr) {
    //     console.error('⚠️ Razorpay Refund Error:', refundErr.message);
    //   }
    // }
    // ============================================================

    res.json({
      message: 'Order cancelled successfully',
      order: {
        _id: order._id,
        status: order.status,
        cancellationReason: order.cancellationReason,
        cancelledAt: order.cancelledAt,
        total: order.total,
      },
    });
  } catch (error) {
    console.error('Cancel Order Error:', error);
    res.status(500).json({ error: 'Failed to cancel order', details: error.message });
  }
};


// ─────────────────────────────────────────────
// ✅ GET: Track order by Delhivery waybill
// ─────────────────────────────────────────────
exports.trackOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findOne({ _id: id, userId: req.user._id });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (!order.awbNumber) {
      return res.status(400).json({
        error: 'Tracking not available yet. Shipment is still being processed.',
      });
    }

    // ── Track via Delhivery One ────────────────
    const { status, scans } = await trackDelhiveryShipment(order.awbNumber);

    // Sync Delhivery status back to DB
    if (status && status !== 'UNKNOWN') {
      const statusMap = {
        Delivered: 'delivered',
        'In Transit': 'shipped',
        'Out for Delivery': 'shipped',
        'RTO Initiated': 'cancelled',
      };
      const mappedStatus = statusMap[status];
      if (mappedStatus && order.status !== mappedStatus) {
        order.status = mappedStatus;
        if (mappedStatus === 'delivered') order.deliveredAt = new Date();
        await order.save();
      }
    }

    res.json({
      message: 'Tracking info retrieved successfully',
      tracking: {
        orderId: order._id,
        waybill: order.awbNumber,
        currentStatus: status,
        history: scans,
      },
    });
  } catch (error) {
    console.error('Track Order Error:', error);
    res.status(500).json({ error: 'Failed to get tracking info', details: error.message });
  }
};