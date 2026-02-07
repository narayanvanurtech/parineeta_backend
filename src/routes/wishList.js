const express = require("express");
const router = express.Router();
const wishlistController = require("../controllers/wishlistController");
const auth = require("../middleware/auth");

console.log("✅ Wishlist routes loading - fixed version");

router.use(auth);

// Add debug middleware to all wishlist routes
router.use((req, res, next) => {
  console.log("🔍 Wishlist route accessed by user:", req.user?._id);
  next();
});

// Wishlist routes
router.get("/", wishlistController.getWishlist);
router.post("/add", wishlistController.addToWishlist);
router.delete("/remove/:itemId", wishlistController.removeFromWishlist);
router.delete("/remove-by-product/:productId", wishlistController.removeFromWishlistByProductId);
router.get("/check/:productId", wishlistController.checkWishlistStatus);
router.post("/move-to-cart/:productId", wishlistController.moveToCart);
router.delete("/clear",wishlistController.clearWishlist)

module.exports = router;
