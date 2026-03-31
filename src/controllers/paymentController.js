const PaymentService = require("../services/paymentService");

// ─────────────────────────────────────────────────────────────────────────────
// 1. Initiate Payment
//    Body: { orderId: <MongoDB Order._id>, addressId }
// ─────────────────────────────────────────────────────────────────────────────
exports.initiatePayment = async (req, res) => {
  try {
    const { orderId, addressId } = req.body;
    const userId = req.user._id;

    if (!orderId || !addressId) {
      return res.status(400).json({
        success: false,
        error: "Order ID and Address ID are required",
      });
    }

    // orderId from body = MongoDB Order._id, renamed to mongoOrderId for clarity
    const result = await PaymentService.initiatePayment({
      userId,
      mongoOrderId: orderId,
      addressId,
    });

    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. Check Payment Status
//    Param: orderId = PhonePe merchantOrderId (CHI_XXXXXXXX)
//           returned from initiatePayment
// ─────────────────────────────────────────────────────────────────────────────
exports.checkStatus = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!orderId) {
      return res.status(400).json({ success: false, error: "Order ID is required" });
    }

    const result = await PaymentService.checkPaymentStatus(orderId);

    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. Single Order Details
//    Param: orderId = PhonePe merchantOrderId (CHI_XXXXXXXX)
// ─────────────────────────────────────────────────────────────────────────────
exports.orderDetails = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user._id;

    if (!orderId) {
      return res.status(400).json({ success: false, error: "Order ID is required" });
    }

    const result = await PaymentService.orderDetails(orderId, userId);

    return res.status(200).json(result);
  } catch (error) {
    return res.status(404).json({ success: false, error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 4. All Orders of a User
// ─────────────────────────────────────────────────────────────────────────────
exports.getUserOrders = async (req, res) => {
  try {
    const userId = req.user._id;

    const result = await PaymentService.getUserOrders(userId, req.query);

    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
};