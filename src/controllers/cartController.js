const { Cart, Product } = require('../config/db');

// Get user's cart
exports.getCart = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const cartItems = await Cart.find({ userId })
      .populate('productId', 'name price images stock');
    
    const total = cartItems.reduce((sum, item) => {
      return sum + (item.productId.price * item.quantity);
    }, 0);
    
    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    
    
    res.json({
      message: 'Cart retrieved successfully',
      cart: cartItems.map(item => ({
        _id: item._id,
        productId: item.productId._id,
        quantity: item.quantity,
        product: item.productId,
        subtotal: item.productId.price * item.quantity
      })),
      total: parseFloat(total.toFixed(2)),
      totalItems
    });
    
  } catch (error) {
    console.error('Get Cart Error:', error);
    res.status(500).json({ error: 'Failed to retrieve cart' });
  }
};

// Add item to cart
exports.addToCart = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const userId = req.user._id;

    if (!productId || !quantity) {
      return res.status(400).json({ 
        error: 'Product ID and quantity are required' 
      });
    }

    if (quantity < 1) {
      return res.status(400).json({ 
        error: 'Quantity must be at least 1' 
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ 
        error: 'Product not found' 
      });
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
      productId 
    });

    let cartItem;
    
    if (existingCartItem) {
      const newQuantity = existingCartItem.quantity + quantity;
      
      if (product.stock < newQuantity) {
        return res.status(400).json({ 
          error: 'Insufficient stock for additional quantity',
          available: product.stock,
          currentInCart: existingCartItem.quantity,
          requestedAdditional: quantity
        });
      }
      
      existingCartItem.quantity = newQuantity;
      cartItem = await existingCartItem.save();
    } else {
      cartItem = new Cart({
        userId,
        productId,
        quantity
      });
      await cartItem.save();
    }

    await cartItem.populate('productId', 'name price images stock');

    res.json({
      message: 'Product added to cart successfully',
      cartItem: {
        _id: cartItem._id,
        userId: cartItem.userId,
        productId: cartItem.productId._id,
        quantity: cartItem.quantity,
        product: cartItem.productId,
        subtotal: cartItem.productId.price * cartItem.quantity
      }
    });

  } catch (error) {
    console.error('Add to Cart Error:', error);
    res.status(500).json({ 
      error: 'Failed to add product to cart'
    });
  }
};

// Update cart item quantity
exports.updateCartItem = async (req, res) => {
  try {
    const { quantity } = req.body;
    const userId = req.user._id;
    
    if (!quantity || quantity < 1) {
      return res.status(400).json({ 
        error: 'Quantity must be at least 1' 
      });
    }
    
    const item = await Cart.findOne({
      _id: req.params.id,
      userId: userId
    }).populate('productId');
    
    if (!item) {
      return res.status(404).json({ error: 'Cart item not found' });
    }
    
    if (item.productId.stock < quantity) {
      return res.status(400).json({ 
        error: 'Insufficient stock',
        available: item.productId.stock,
        requested: quantity
      });
    }
    
    item.quantity = quantity;
    await item.save();
    
    res.json({ 
      message: 'Cart item updated successfully',
      item: {
        id: item._id,
        productId: item.productId._id,
        quantity: item.quantity,
        product: {
          id: item.productId._id,
          name: item.productId.name,
          price: item.productId.price,
          images: item.productId.images || []
        },
        subtotal: item.productId.price * item.quantity
      }
    });
    
  } catch (error) {
    console.error('Update Cart Error:', error);
    res.status(500).json({ 
      error: 'Failed to update cart item'
    });
  }
};

// Remove item from cart
exports.removeFromCart = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const item = await Cart.findOneAndDelete({
      _id: req.params.id,
      userId: userId
    }).populate('productId');
    
    if (!item) {
      return res.status(404).json({ error: 'Cart item not found' });
    }
    
    res.json({
      message: 'Item removed from cart successfully',
      removedItem: {
        id: item._id,
        productName: item.productId.name,
        quantity: item.quantity
      }
    });
    
  } catch (error) {
    console.error('Remove from Cart Error:', error);
    res.status(500).json({ error: 'Failed to remove item from cart' });
  }
};

// Clear entire cart
exports.clearCart = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const result = await Cart.deleteMany({ userId });
    
    res.json({
      message: 'Cart cleared successfully',
      deletedCount: result.deletedCount
    });
    
  } catch (error) {
    console.error('Clear Cart Error:', error);
    res.status(500).json({ error: 'Failed to clear cart' });
  }
};