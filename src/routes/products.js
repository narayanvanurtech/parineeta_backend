const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");
const multer = require("multer");

console.log("✅ Products routes loading - working version");


const storage = multer.memoryStorage();
const upload = multer({
  storage,
});

// Public routes
router.get("/", productController.getAllProducts);
router.get("/:id", productController.getProductById);
router.get("/:productId/:variantId",productController.getProductWithVariant)


// Admin routes
router.post("/", auth, admin.adminMiddleware, productController.createProduct);
router.put("/:id", auth, admin.adminMiddleware, productController.updateProduct);
router.delete("/:id", auth, admin.adminMiddleware, productController.deleteProduct);


//Add Variant
router.post("/:productId/variants",auth,admin.adminMiddleware,upload.fields([{ name: "images", maxCount: 6 }]),productController.addVariant)
router.put(
  "/:productId/variants/:variantId",
  upload.fields([{ name: "images" }]),
  productController.updateVariant
);
router.delete(
  "/:productId/variants/:variantId",
  productController.deleteVariant
);


//Add Size
router.post("/:productId/:variantId",auth,productController.addSizeToVariant)


module.exports = router;
