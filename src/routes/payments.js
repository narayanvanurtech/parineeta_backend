const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");
const auth = require("../middleware/auth");

// POST /api/payment/initiate
// Body: { orderId: <MongoDB Order._id>, addressId }
router.post("/initiate", auth, paymentController.initiatePayment);

// GET /api/payment/status/:orderId
// orderId = PhonePe merchantOrderId (CHI_XXXXXXXX) returned from /initiate
router.get("/status/:orderId", auth, paymentController.checkStatus);

// GET /api/payment/orders
// Returns paginated list of all payments for the logged-in user
// Query: ?page=1&limit=10
router.get("/orders", auth, paymentController.getUserOrders);

// GET /api/payment/orders/:orderId
// orderId = PhonePe merchantOrderId (CHI_XXXXXXXX)
router.get("/orders/:orderId", auth, paymentController.orderDetails);

module.exports = router;