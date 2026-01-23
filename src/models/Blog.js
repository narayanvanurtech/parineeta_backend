const mongoose = require("mongoose");

const BlogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    category:{
        type:String,
        required:true
    },
    status:{
        enum:["Published","Draft"],
        default:"Published",
    },
    PublishDate:{
        type:String,
        required:true
    },
    image:{
        type:[String],
        required:true
    },
    content:{
        type:String,
        required:true
    }
  },
  { timestamps: true },
);

module.exports = mongoose.model("Blog", BlogSchema);
