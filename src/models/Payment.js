const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },
  cartIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Cart",
    required: true
  }],
  address: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Address",
    required: true
  },
  orderId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  amount: {
    type: Number,
    required: true,
    min: 1
  },
  currency: {
    type: String,
    default: "INR"
  },
  status: {
    type: String,
    enum: ["PENDING", "SUCCESS", "FAILED", "CANCELLED", "EXPIRED"],
    default: "PENDING",
    index: true
  },
  paymentMethod: {
    type: String,
    enum: ["PHONEPE", "COD"],
    default: "PHONEPE"
  },
  paymentUrl: {
    type: String
  },
  phonePeTransactionId: {
    type: String
  },
  merchantTransactionId: {
    type: String,
    unique: true,
    sparse: true
  },
  products: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    price: {
      type: Number,
      required: true,
      min: 0
    }
  }],
  rawResponse: {
    type: mongoose.Schema.Types.Mixed
  },
  rawWebhookData: {
    type: mongoose.Schema.Types.Mixed
  },
  paidAt: {
    type: Date
  },
  failedAt: {
    type: Date
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 60 * 1000) // 30 minutes
  },
  statusCheckCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes for better performance
paymentSchema.index({ userId: 1, status: 1 });
paymentSchema.index({ orderId: 1 });
paymentSchema.index({ createdAt: 1 });
paymentSchema.index({ status: 1, expiresAt: 1 });
paymentSchema.index({ merchantTransactionId: 1 });

// Instance methods
paymentSchema.methods.isExpired = function() {
  return this.status === 'PENDING' && new Date() > this.expiresAt;
};

paymentSchema.methods.canRetry = function() {
  return this.status === 'FAILED' &&
         this.statusCheckCount < 5 &&
         new Date() < new Date(this.createdAt.getTime() + 24 * 60 * 60 * 1000);
};

// Virtuals
paymentSchema.virtual('amountInRupees').get(function() {
  return this.amount / 100;
});

paymentSchema.set('toJSON', { virtuals: true });
paymentSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model("Payment", paymentSchema);
