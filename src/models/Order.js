const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
  },
  variantId: {
    type: mongoose.Schema.Types.ObjectId,
  },
  name: {
    type: String,
  },
  color: {
    type: String,
  },
  size: {                               // ✅ ADDED — size name (e.g. "M", "L", "XL")
    type: String,
    default: null,
  },
  price: {
    type: Number,
  },
  quantity: {
    type: Number,
  },
  image: {
    type: String,
  },
  subtotal: {
    type: Number,
  },
});

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    items: [orderItemSchema],

    total: {
      type: Number,
      required: true,
      min: 0,
    },

    shippingAddress: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Address',
      required: true,
    },

    // ── Payment ───────────────────────────────
    paymentMethod: {
      type: String,
      enum: ['COD', 'Online'],
      default: 'COD',
      required: true,
    },

    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
    },

    // 💳 Razorpay Fields — uncomment when payment is live
    // razorpayOrderId: {
    //   type: String,
    //   default: null,
    // },
    // razorpayPaymentId: {
    //   type: String,
    //   default: null,
    // },
    // refundId: {
    //   type: String,
    //   default: null,
    // },
    // paidAt: {
    //   type: Date,
    //   default: null,
    // },

    // ── Order Status ──────────────────────────
    status: {
      type: String,
      enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
    },

    orderDate: {
      type: Date,
      default: Date.now,
    },

    deliveredAt: {                      // ✅ ADDED — auto-set when status → delivered
      type: Date,
      default: null,
    },

    // ── Tracking ──────────────────────────────
    trackingNumber: {                   // internal order ID (e.g. parineeta-xxxx-xxx)
      type: String,
      default: null,
    },

    // ✅ Delhivery One Fields (replaces Shiprocket)
    delhiveryWaybill: {                 // waybill returned by Delhivery on shipment creation
      type: String,
      default: null,
    },

    awbNumber: {                        // same as delhiveryWaybill — kept for consistency
      type: String,
      default: null,
    },

    delhiveryRaw: {                     // raw Delhivery API response (for debugging)
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    // ── Cancellation ──────────────────────────
    cancellationReason: {
      type: String,
      default: null,
    },

    cancelledAt: {
      type: Date,
      default: null,
    },

    cancelledBy: {
      type: String,
      enum: ['user', 'admin', null],
      default: null,
    },
  },
  {
    timestamps: true,                   // createdAt + updatedAt auto-managed
  }
);

// ── Indexes ───────────────────────────────────
orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ delhiveryWaybill: 1 });   // ✅ replaces shiprocketOrderId index
orderSchema.index({ awbNumber: 1 });
orderSchema.index({ trackingNumber: 1 });

module.exports = mongoose.model('Order', orderSchema);