const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  category: {
    type: String,
    required: true
  },
  stock: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  sizes: {
    type: [String],
    enum: {
      values: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
      message: '{VALUE} is not a valid size'
    },
    required: true,
    validate: {
      validator: function(v) {
        return v && v.length > 0;
      },
      message: 'At least one size must be specified'
    }
  },
  colors: {
    type: [String],
    required: true,
    validate: {
      validator: function(v) {
        return v && v.length > 0;
      },
      message: 'At least one color must be specified'
    }
  },
    images: {
    type: [String],
    default: []
  }
}, {
  timestamps: true
});


module.exports = mongoose.model('Product', productSchema);