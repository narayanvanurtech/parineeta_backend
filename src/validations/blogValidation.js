const mongoose = require("mongoose");

const blogValidation = (req, res, next) => {
  const {
    title,
    author,
    category,
    status,
    PublishDate,
    images,
    content,
  } = req.body;

  // 🟢 Title
  if (!title || typeof title !== "string" || title.trim().length < 3) {
    return res.status(400).json({
      message: "Title is required and must be at least 3 characters long",
    });
  }

  // 🟢 Author (MongoDB ObjectId)
  if (!author || !mongoose.Types.ObjectId.isValid(author)) {
    return res.status(400).json({
      message: "Valid author ID is required",
    });
  }

  // 🟢 Category
  if (!category || typeof category !== "string") {
    return res.status(400).json({
      message: "Category is required",
    });
  }

  // 🟢 Status
  const allowedStatus = ["Published", "Draft"];
  if (status && !allowedStatus.includes(status)) {
    return res.status(400).json({
      message: "Status must be either Published or Draft",
    });
  }

  // 🟢 Publish Date
  if (!PublishDate || isNaN(Date.parse(PublishDate))) {
    return res.status(400).json({
      message: "Valid PublishDate is required",
    });
  }

  // 🟢 Images
  if (!Array.isArray(images) || images.length === 0) {
    return res.status(400).json({
      message: "At least one image is required",
    });
  }

  // 🟢 Content
  if (!content || typeof content !== "string" || content.trim().length < 10) {
    return res.status(400).json({
      message: "Content must be at least 10 characters long",
    });
  }

  // ✅ Passed all checks
  next();
};

module.exports = blogValidation;
