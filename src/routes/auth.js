const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const auth = require("../middleware/auth");

console.log("✅ Auth routes loading with all methods");

// Public routes
router.post("/register", authController.register);
router.post("/login", authController.unifiedLogin);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password/:token", authController.resetPassword);
router.get("/verify-reset-token/:token", authController.verifyResetToken);

// Protected routes
router.get("/me", auth, authController.getProfile);
router.put("/me", auth, authController.updateProfile);
router.post("/change-password", auth, authController.changePassword);
router.post("/logout", auth, authController.logout);

module.exports = router;
