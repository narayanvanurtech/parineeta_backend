const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");

console.log("✅ Orders routes loading - fixed version");

// User routes
router.get("/", auth, orderController.getUserOrders);
router.get("/:id", auth, orderController.getOrderById);
router.post("/", auth, orderController.createOrder);

// Cancel order route (both user and admin can use)
router.put("/:id/cancel", auth, orderController.cancelOrder);
router.patch("/:id/cancel", auth, orderController.cancelOrder); // Keep PATCH for backward compatibility

// Admin routes
router.get("/admin/all", auth, admin.adminMiddleware, orderController.getAllOrders);
router.put("/admin/:id/status", auth, admin.adminMiddleware, orderController.updateOrderStatus);

module.exports = router;
