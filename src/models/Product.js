const mongoose = require("mongoose");

const sizeSchema = new mongoose.Schema(
  {
    size: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
   
    stock: {
      type: Number,
      required: true,
      min: 0,
    },

    price: {
      type: Number, // original price
      required: true,
    },

    discount: {
      type: Number, // percentage
      default: 0,
      min: 0,
      max: 100,
    },
  },
  {
    _id: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

const variantSchema = new mongoose.Schema(
  {
    color: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    images: {
      type: [String], // images per color
      default: [],
    },

    sizes: {
      type: [sizeSchema], // sizes under each color
      default: [],
    },
  },
  { _id: true },
);

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
    },

    category: {
      type: String,
      required: true,
    },
 coreCategory: {
      type: String,
    },
    subcategory: {
      type: String,
      default: "",
    },

    stock: {
      type: Number,
      default: 0,
    },

    colors: {
      type: [String], // derived from variants
      default: [],
    },

    variants: {
      type: [variantSchema],
      default: [],
    },
  },
  { timestamps: true },
);

productSchema.pre("save", function (next) {
  // derive colors from variants
  if (this.variants?.length) {
    this.colors = [...new Set(this.variants.map((v) => v.color))];
  }

  // calculate total stock
  this.stock = this.variants.reduce(
    (total, variant) =>
      total + variant.sizes.reduce((sum, size) => sum + size.stock, 0),
    0,
  );

  next();
});

sizeSchema.virtual("finalPrice").get(function () {
  return this.price - (this.price * this.discount) / 100;
});

module.exports = mongoose.model("Product", productSchema);
