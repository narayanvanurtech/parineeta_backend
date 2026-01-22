const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");

console.log("✅ Products routes loading - working version");

// Public routes
router.get("/", productController.getAllProducts);
router.get("/:id", productController.getProductById);

// Admin routes
router.post("/", auth, admin.adminMiddleware, productController.createProduct);
router.put("/:id", auth, admin.adminMiddleware, productController.updateProduct);
router.delete("/:id", auth, admin.adminMiddleware, productController.deleteProduct);

module.exports = router;
