const mongoose = require("mongoose");

const variantSchema = new mongoose.Schema(
  {
    color: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    stock: {
      type: Number,
      required: true,
      min: 0,
    },
    price: {
      type: Number, 
    },
    images: {
      type: [String], 
      default: [],
    },
  },
  { _id: true } 
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: String,
    category: { type: String, required: true },
    subcategory: { type: String,default:"" },
    stock: { type: Number, required: true }, 
    sizes: [String],

    colors: {
      type: [String], 
      default: [],
    },

    price: {
      type: Number, 
    },
    variants: {
      type: [variantSchema],
      default: [],
    },
     totalPrice: { type: Number,default:0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
