const express = require("express");
const router = express.Router();
const subtitleController = require("../controllers/subtitleController");
const admin = require("../middleware/admin");

router.post("/add", admin.adminMiddleware, subtitleController.addSubtitle);
router.put("/update", subtitleController.updateSubtitle);
router.delete("/delete", subtitleController.deleteSubtitle);

module.exports = router;
