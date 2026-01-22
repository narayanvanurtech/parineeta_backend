const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");
const auth = require("../middleware/auth");

console.log("✅ Payment routes loading...");

// Only use routes that definitely work
router.post("/initiate", auth, paymentController.initiatePayment);
router.get("/status/:orderId", auth, paymentController.checkStatus);

module.exports = router;
