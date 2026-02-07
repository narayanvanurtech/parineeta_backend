const { Wishlist, Product, Cart } = require('../config/db');
const mongoose = require("mongoose");


const getWishlist = async (req, res) => {
  try {
    const userId = req.user._id;

    const wishlistItems = await Wishlist.find({ userId })
      .populate({
        path: 'productId',
        // ❌ REMOVE field selection → get full product
      })
      .sort({ createdAt: -1 });

    const validWishlistItems = wishlistItems.filter(item => item.productId);

    res.json({
      success: true,
      message: 'Wishlist retrieved successfully',
      total: validWishlistItems.length,
      wishlist: validWishlistItems.map(item => ({
        _id: item._id,                // wishlist item id
        productId: item.productId._id,
        product: item.productId,      // ✅ FULL PRODUCT OBJECT
        addedAt: item.createdAt
      }))
    });
  } catch (error) {
    console.error('Get Wishlist Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve wishlist'
    });
  }
};

const addToWishlist = async (req, res) => {
  try {
    const { productId } = req.body;
    const userId = req.user._id;

    if (!productId) {
      return res.status(400).json({ error: 'Product ID is required' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const existingItem = await Wishlist.findOne({ userId, productId });
    if (existingItem) {
      return res.status(400).json({
        error: 'Product already in wishlist',
        wishlistItemId: existingItem._id
      });
    }

    const wishlistItem = new Wishlist({ userId, productId });
    await wishlistItem.save();

    // ✅ populate FULL product data
    await wishlistItem.populate('productId');

    res.status(201).json({
      success:true,
      message: 'Product added to wishlist successfully',
      wishlistItem: wishlistItem   
    });

  } catch (error) {
    console.error('Add to Wishlist Error:', error);

    if (error.code === 11000) {
      return res.status(400).json({ error: 'Product already in wishlist' });
    }

    res.status(500).json({ error: 'Failed to add product to wishlist' });
  }
};



const removeFromWishlist = async (req, res) => {
  try {
    const userId = req.user._id;
    console.log(req.params)
    const {itemId} = req.params;
  console.log(itemId)
    if (!mongoose.Types.ObjectId.isValid(itemId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid wishlist item id"
      });
    }

    const item = await Wishlist.findOneAndDelete({
      _id: itemId,
      userId
    }).populate("productId"); // ✅ full product JSON

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Wishlist item not found"
      });
    }

    res.json({
      success: true,
      message: "Item removed from wishlist",
      data: {
        wishlistItemId: item._id,
        removedProduct: item.productId || null,
        removedAt: new Date()
      }
    });

  } catch (error) {
    console.error("Remove Wishlist Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to remove wishlist item"
    });
  }
};


const removeFromWishlistByProductId = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product id"
      });
    }

    const item = await Wishlist.findOneAndDelete({
      userId,
      productId
    }).populate("productId"); // ✅ full product JSON

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Product not found in wishlist"
      });
    }

    res.json({
      success: true,
      message: "Product removed from wishlist",
      data: {
        wishlistItemId: item._id,
        removedProduct: item.productId || null,
        removedAt: new Date()
      }
    });

  } catch (error) {
    console.error("Remove by ProductId Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to remove product from wishlist"
    });
  }
};


const checkWishlistStatus = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId } = req.params;
    
    const item = await Wishlist.findOne({ userId, productId });
    
    res.json({
      inWishlist: !!item,
      wishlistItemId: item ? item._id : null
    });
  } catch (error) {
    console.error('Check Wishlist Status Error:', error);
    res.status(500).json({ error: 'Failed to check wishlist status' });
  }
};

const moveToCart = async (req, res) => {
  try {
    const userId = req.user._id;
    const wishlistItemId = req.params.id;
    const { quantity = 1 } = req.body;
    
    const wishlistItem = await Wishlist.findOne({
      _id: wishlistItemId,
      userId
    }).populate('productId');
    
    if (!wishlistItem) {
      return res.status(404).json({ error: 'Wishlist item not found' });
    }
    
    const product = wishlistItem.productId;
    
    if (!product) {
      return res.status(404).json({ error: 'Product no longer available' });
    }
    
    if (product.stock < quantity) {
      return res.status(400).json({ 
        error: 'Insufficient stock',
        available: product.stock,
        requested: quantity
      });
    }
    
    const existingCartItem = await Cart.findOne({ 
      userId, 
      productId: product._id 
    });
    
    if (existingCartItem) {
      existingCartItem.quantity += quantity;
      await existingCartItem.save();
    } else {
      await Cart.create({
        userId,
        productId: product._id,
        quantity
      });
    }
    
    await Wishlist.findByIdAndDelete(wishlistItemId);
    
    res.json({
      message: 'Product moved to cart successfully',
      product: {
        _id: product._id,
        name: product.name,
        price: product.price
      }
    });
  } catch (error) {
    console.error('Move to Cart Error:', error);
    res.status(500).json({ error: 'Failed to move product to cart' });
  }
};

// controllers/wishlist.controller.js
const clearWishlist = async (req, res) => {
  try {
    const userId = req.user._id;

    await Wishlist.deleteMany({ userId });

    res.status(200).json({
      success: true,
      message: "Wishlist cleared successfully",
    });
  } catch (error) {
    console.error("Clear Wishlist Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to clear wishlist",
    });
  }
};



module.exports = {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  removeFromWishlistByProductId,
  checkWishlistStatus,
  moveToCart,
  clearWishlist
};