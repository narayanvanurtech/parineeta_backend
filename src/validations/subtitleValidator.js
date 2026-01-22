const mongoose = require("mongoose");

const validateAddSubtitle = (req, res, next) => {
  const { categoryId, path, subtitle } = req.body;

  
  if (!categoryId || !mongoose.Types.ObjectId.isValid(categoryId)) {
    return res.status(400).json({
      error: "Invalid or missing categoryId",
    });
  }

  if (!Array.isArray(path)) {
    return res.status(400).json({
      error: "Path must be an array",
    });
  }

  if (!path.every(Number.isInteger) || path.some(i => i < 0)) {
    return res.status(400).json({
      error: "Path must contain only positive integers",
    });
  }

  if (!subtitle || typeof subtitle !== "object") {
    return res.status(400).json({
      error: "Subtitle object is required",
    });
  }

  if (!subtitle.name || typeof subtitle.name !== "string") {
    return res.status(400).json({
      error: "Subtitle name is required and must be a string",
    });
  }

  if (
    subtitle.description &&
    typeof subtitle.description !== "string"
  ) {
    return res.status(400).json({
      error: "Subtitle description must be a string",
    });
  }

  next(); 
};


module.exports ={
    validateAddSubtitle
}