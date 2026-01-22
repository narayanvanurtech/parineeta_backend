const mongoose = require("mongoose");

const subtitleSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, default: "" },
  subtitles: []
});

// recursive
subtitleSchema.add({
  subtitles: [subtitleSchema]
});

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  description: { type: String, default: "" },
  subtitles: [subtitleSchema]
}, { timestamps: true });

module.exports = mongoose.model("Category", categorySchema);
