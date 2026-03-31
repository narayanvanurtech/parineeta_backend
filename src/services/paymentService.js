const Payment = require("../models/Payment");
const Order = require("../models/Order");
const { v4: uuidv4 } = require("uuid");
const { StandardCheckoutPayRequest } = require("pg-sdk-node"); // ✅ required for builder
const { getPhonePeClient } = require("../config/phonepe");

// ✅ Initialise once at module level — not inside every method call
const phonePeClient = getPhonePeClient();

class PaymentService {

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. Initiate Payment
  //    mongoOrderId = the MongoDB Order._id sent from the client
  // ─────────────────────────────────────────────────────────────────────────────
  static async initiatePayment({ userId, mongoOrderId, addressId }) {

    // ── Fetch the order ───────────────────────────────────────────────────────
    const order = await Order.findOne({ _id: mongoOrderId, userId }).populate(
      "items.productId"
    );

    if (!order) {
      throw new Error("Order not found or does not belong to user");
    }

    if (!order.items || order.items.length === 0) {
      throw new Error("Order has no items");
    }

    // ── Build products snapshot ───────────────────────────────────────────────
    const amount = order.total;

    if (!amount || amount <= 0) {
      throw new Error("Invalid order amount");
    }

    const products = order.items.map((item) => ({
      productId: item.productId._id,
      quantity: item.quantity,
      price: item.price,
    }));

    // ── Generate IDs ──────────────────────────────────────────────────────────
    // merchantOrderId  → passed to PhonePe, stored as Payment.orderId
    // merchantTransactionId → stored for our own reference
    const merchantOrderId = `PR_${Math.floor(10000000 + Math.random() * 90000000)}`;
    const merchantTransactionId = `TXN_${uuidv4()}`;
    const redirectUrl = `${process.env.MERCHANT_REDIRECT_URL}?orderId=${merchantOrderId}`;

    // ── Build PhonePe request using the SDK builder ───────────────────────────
    // ✅ StandardCheckoutPayRequest.builder() is the ONLY correct way
    //    DO NOT pass a plain object to phonePeClient.pay()
    const paymentRequest = StandardCheckoutPayRequest.builder()
      .merchantOrderId(merchantOrderId)       // PhonePe tracks by this ID
      .amount(Math.round(amount*100))       // must be in paise (₹1 = 100 paise)
      .redirectUrl(redirectUrl)
      .build();

    // ── Call PhonePe ──────────────────────────────────────────────────────────
    const response = await phonePeClient.pay(paymentRequest);
    // response.redirectUrl is the PhonePe checkout page URL

    // ── Mark order as payment pending ─────────────────────────────────────────
    await Order.findByIdAndUpdate(mongoOrderId, { status: "payment_pending" });

    // ── Save payment record ───────────────────────────────────────────────────
    const payment = await Payment.create({
      userId,
      orderRef: mongoOrderId,           // MongoDB Order reference
      address: addressId,
      orderId: merchantOrderId,         // PhonePe merchant order ID (CHI_...)
      merchantTransactionId,
      amount,
      products,
      status: "PENDING",
      paymentUrl: response.redirectUrl,
    });

    return {
      success: true,
      paymentUrl: response.redirectUrl,
      orderId: merchantOrderId,         // ← client stores this for status checks
      amount,
      payment,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. Check Payment Status
  //    orderId = PhonePe merchantOrderId (CHI_XXXXXXXX) — NOT merchantTransactionId
  // ─────────────────────────────────────────────────────────────────────────────
  static async checkPaymentStatus(orderId) {

    // ✅ Pass the merchantOrderId (CHI_...) directly — NOT merchantTransactionId
    const response = await phonePeClient.getOrderStatus(orderId);

    // ── Map PhonePe state → our status ───────────────────────────────────────
    let status = "PENDING";
    let paidAt = null;
    let failedAt = null;

    if (response.state === "COMPLETED") {
      status = "SUCCESS";
      paidAt = new Date();
    } else if (response.state === "FAILED") {
      status = "FAILED";
      failedAt = new Date();
    }

    // ── Update payment record ─────────────────────────────────────────────────
    const updated = await Payment.findOneAndUpdate(
      { orderId },
      {
        status,
        rawResponse: response,
        paidAt,
        failedAt,
        $inc: { statusCheckCount: 1 },
      },
      { new: true }
    ).populate("userId");

    if (!updated) {
      throw new Error("Payment record not found");
    }

    // ── Confirm order on successful payment ───────────────────────────────────
    if (status === "SUCCESS") {
      await Order.findByIdAndUpdate(updated.orderRef, { status: "confirmed" });
    }

    return {
      success: true,
      status,
      orderId,
      amount: updated.amount,
      payment: updated,
      rawStatus: response.state,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. Single Order Details
  //    orderId = PhonePe merchantOrderId (CHI_XXXXXXXX)
  // ─────────────────────────────────────────────────────────────────────────────
  static async orderDetails(orderId, userId) {
    const payment = await Payment.findOne({ orderId, userId })
      .populate("userId")
      .populate("products.productId")
      .populate("address")
      .populate("orderRef");

    if (!payment) {
      throw new Error("Order not found");
    }

    return { order: payment };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. All Orders of a User (Paginated)
  // ─────────────────────────────────────────────────────────────────────────────
  static async getUserOrders(userId, query) {
    let { page = 1, limit = 10 } = query;
    page = Number(page);
    limit = Number(limit);
    const skip = (page - 1) * limit;

    const orders = await Payment.find({ userId })
      .populate("products.productId")
      .populate("userId")
      .populate("address")
      .populate("orderRef")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalOrders = await Payment.countDocuments({ userId });

    return {
      success: true,
      orders,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalOrders / limit),
        totalOrders,
        limit,
      },
    };
  }
}

module.exports = PaymentService;