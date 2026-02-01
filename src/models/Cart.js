const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  variantId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  size: {
      _id: { type: mongoose.Schema.Types.ObjectId },
      size: { type: String },
      price: { type: Number },
      discount: { type: Number },
      finalPrice: { type: Number },
      stock: { type: Number },
    },
  quantity: {
    type: Number,
    required: true,
  },
},{timestamps:true});


module.exports = mongoose.model('Cart', cartSchema);