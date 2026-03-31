const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");

console.log("✅ Orders routes loading - fixed version");

// ─── User Routes ───────────────────────────────────────────
router.get("/", auth, orderController.getUserOrders);
router.post("/", auth, orderController.createOrder);

// ⚠️ IMPORTANT: specific routes must come BEFORE /:id routes
router.get("/:id/track", auth, orderController.trackOrder);   // ✅ ADDED

router.get("/:id", auth, orderController.getOrderById);

// Cancel order (user & admin)
router.put("/:id/cancel", auth, orderController.cancelOrder);
router.patch("/:id/cancel", auth, orderController.cancelOrder); // backward compatibility

// ─── Admin Routes ───────────────────────────────────────────
router.get("/admin/all", auth, admin.adminMiddleware, orderController.getAllOrders);
router.put("/admin/:id/status", auth, admin.adminMiddleware, orderController.updateOrderStatus);

module.exports = router;