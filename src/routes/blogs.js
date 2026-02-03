const express = require("express");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");
const blogController = require("../controllers/blogController");
const multer = require("multer");

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
});



router.post(
  "/addBlogs",
  auth,
 admin.adminMiddleware,
  upload.fields([{ name: "image", maxCount: 6 }]),

  blogController.addBlogs 
);
router.get("/getBlogs",blogController.getAllBlogs)
router.delete("/:id",blogController.deleteBlogs)
router.put("/:id",admin.adminMiddleware,upload.fields([{ name: "image", maxCount: 6 }]),blogController.updateBlog)

module.exports = router;
