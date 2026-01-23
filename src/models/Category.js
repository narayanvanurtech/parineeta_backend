const mongoose = require("mongoose");

const SubtitleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },
    description: {
      type: String,
      default: ""
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true
    },
    subtitles: [] // recursive
  },
  { _id: true }
);

// recursion
SubtitleSchema.add({ subtitles: [SubtitleSchema] });

const CategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },
    description: {
      type: String,
      default: ""
    },
    subtitles: [SubtitleSchema]
  },
  { timestamps: true }
);

module.exports = mongoose.model("Category", CategorySchema);
