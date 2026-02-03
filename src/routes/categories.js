const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/categoryController");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");

console.log("✅ Categories routes loading - fixed version");

// Public routes
router.get("/", categoryController.getAllCategories);
router.get("/:id", categoryController.getCategoryById);
router.get("/:id/products", categoryController.getProductsByCategory);

// Admin-only routes
router.post("/", auth, admin.adminMiddleware, categoryController.createCategory);
router.put("/:id", auth, admin.adminMiddleware, categoryController.updateCategory);
router.delete("/:id", auth, admin.adminMiddleware, categoryController.deleteCategory);

module.exports = router;
