const express = require("express");
const router = express.Router();
const addressController = require("../controllers/addressController");
const auth = require("../middleware/auth");

console.log("✅ Address routes loading - fixed version");

// All routes require authentication
router.use(auth);

// Routes
router.get("/", addressController.getUserAddresses);
router.get("/:id", addressController.getAddressById);
router.post("/", addressController.createAddress);
router.put("/:id", addressController.updateAddress);
router.delete("/:id", addressController.deleteAddress);
router.put("/:id/default", addressController.setDefaultAddress);

module.exports = router;
