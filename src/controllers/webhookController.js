const PaymentService = require("../services/paymentService");

exports.phonePeWebhook = async (req, res) => {
  try {
    console.log("📞 PhonePe Webhook Received:", req.body);
    
    // Verify webhook signature (important for security)
    // You should implement signature verification based on PhonePe docs
    
    const result = await PaymentService.handleWebhook(req.body);
    
    if (result.success) {
      res.status(200).json({ success: true, message: "Webhook processed" });
    } else {
      res.status(400).json({ success: false, error: result.error });
    }
  } catch (error) {
    console.error("❌ Webhook Controller Error:", error);
    res.status(500).json({ success: false, error: "Webhook processing failed" });
  }
};
