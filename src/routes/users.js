const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");

console.log("✅ Users routes loading - fixed version");

// Admin-only routes
router.get("/", auth, admin.adminMiddleware, userController.getAllUsers);
router.get("/:id", auth, admin.adminMiddleware, userController.getUserById);
router.delete("/:id", auth, admin.adminMiddleware, userController.deleteUser);
router.put("/:id",auth,admin.adminMiddleware,userController.updateUser)

module.exports = router;
