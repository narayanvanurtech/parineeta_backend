const express = require("express");
const router = express.Router();
const cartController = require("../controllers/cartController");
const auth = require("../middleware/auth");

console.log("✅ Cart routes loading - FIXED VERSION");

// All routes require authentication
router.use(auth);

// Routes
router.get("/", cartController.getCart);
router.post("/", cartController.addToCart);
router.post("/add", cartController.addToCart);
router.put("/update/:id", cartController.updateCartItem);  // CHANGED :itemId to :id
router.delete("/remove/:id", cartController.removeFromCart);  // CHANGED :itemId to :id
router.delete("/clear", cartController.clearCart);

console.log("🛒 Cart routes registered successfully");

module.exports = router;
