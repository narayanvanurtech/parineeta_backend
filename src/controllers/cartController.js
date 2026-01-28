const { Cart, Product } = require('../config/db');

// Get user's cart
exports.getCart = async (req, res) => {
  try {
    const userId = req.user._id;

    // Fetch cart items + product + variants
    const cartItems = await Cart.find({ userId }).populate(
      "productId",
      "name category subcategory variants"
    );

    let total = 0;
    let totalItems = 0;

    const formattedCart = [];

    for (const item of cartItems) {
      // ❌ product deleted
      if (!item.productId) {
        await Cart.findByIdAndDelete(item._id);
        continue;
      }

      // ❌ variant missing (old cart data)
      const variant = item.productId.variants.id(item.variantId);
      if (!variant) {
        await Cart.findByIdAndDelete(item._id);
        continue;
      }

      const subtotal = variant.price * item.quantity;

      total += subtotal;
      totalItems += item.quantity;

      formattedCart.push({
        _id: item._id,
        quantity: item.quantity,

        product: {
          _id: item.productId._id,
          name: item.productId.name,
          category: item.productId.category,
          subcategory: item.productId.subcategory,
        },

        variant: {
          _id: variant._id,
          color: variant.color,
          price: variant.price,
          images: variant.images,
          stock: variant.stock,
        },

        subtotal,
      });
    }

    res.status(200).json({
      message: "Cart retrieved successfully",
      cart: formattedCart,
      total: Number(total.toFixed(2)),
      totalItems,
    });
  } catch (error) {
    console.error("Get Cart Error:", error);
    res.status(500).json({ error: "Failed to retrieve cart" });
  }
};



// Add item to cart
exports.addToCart = async (req, res) => {
  try {
    const { productId, variantId, quantity } = req.body;
    const userId = req.user._id;

    if (!productId || !variantId || !quantity) {
      return res.status(400).json({
        error: "Product ID, Variant ID and quantity are required",
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    const variant = product.variants.id(variantId);
    if (!variant) {
      return res.status(404).json({ error: "Variant not found" });
    }

    if (variant.stock < quantity) {
      return res.status(400).json({
        error: "Insufficient stock",
        available: variant.stock,
      });
    }

    let cartItem = await Cart.findOne({
      userId,
      productId,
      variantId,
    });

    if (cartItem) {
      const newQty = cartItem.quantity + quantity;

      if (variant.stock < newQty) {
        return res.status(400).json({
          error: "Insufficient stock for additional quantity",
        });
      }

      cartItem.quantity = newQty;
      await cartItem.save();
    } else {
      cartItem = await Cart.create({
        userId,
        productId,
        variantId,
        quantity,
      });
    }

    res.json({
      message: "Added to cart",
      cartItem,
    });
  } catch (error) {
    console.error("Add to Cart Error:", error);
    res.status(500).json({ error: "Failed to add product to cart" });
  }
};

// Update cart item quantity
exports.updateCartItem = async (req, res) => {
  try {
    const { quantity } = req.body;
    const userId = req.user._id;
    const cartItemId = req.params.id;

    if (!quantity || quantity < 1) {
      return res.status(400).json({
        error: "Quantity must be at least 1",
      });
    }

    // 🔹 Find cart item
    const cartItem = await Cart.findOne({
      _id: cartItemId,
      userId,
    }).populate("productId");

    if (!cartItem) {
      return res.status(404).json({
        error: "Cart item not found",
      });
    }

    if (!cartItem.productId) {
      return res.status(404).json({
        error: "Product not found",
      });
    }

    // 🔹 Find selected variant
    const variant = cartItem.productId.variants.id(cartItem.variantId);

    if (!variant) {
      return res.status(404).json({
        error: "Variant not found",
      });
    }

    // 🔹 Stock validation (VARIANT stock)
    if (quantity > variant.stock) {
      return res.status(400).json({
        error: "Insufficient stock",
        available: variant.stock,
      });
    }

    // 🔹 Update quantity
    cartItem.quantity = quantity;
    await cartItem.save();

    const subtotal = variant.price * quantity;

    res.json({
      message: "Cart item updated successfully",
      item: {
        cartItemId: cartItem._id,
        quantity: cartItem.quantity,

        product: {
          _id: cartItem.productId._id,
          name: cartItem.productId.name,
          category: cartItem.productId.category,
          subcategory: cartItem.productId.subcategory,
        },

        variant: {
          _id: variant._id,
          color: variant.color,
          price: variant.price,
          images: variant.images,
          stock: variant.stock,
        },

        subtotal,
      },
    });
  } catch (error) {
    console.error("Update Cart Error:", error);
    res.status(500).json({
      error: "Failed to update cart item",
    });
  }
};


// Remove item from cart
exports.removeFromCart = async (req, res) => {
  try {
    const userId = req.user._id;

    const removedItem = await Cart.findOneAndDelete({
      _id: req.params.id,
      userId,
    }).populate("productId", "name");

    if (!removedItem) {
      return res.status(404).json({
        error: "Cart item not found",
      });
    }

    res.json({
      message: "Item removed from cart successfully",
      removedItem: {
        cartItemId: removedItem._id,
        productName: removedItem.productId.name,
        quantity: removedItem.quantity,
      },
    });
  } catch (error) {
    console.error("Remove Cart Item Error:", error);
    res.status(500).json({
      error: "Failed to remove item from cart",
    });
  }
};


// Clear entire cart
exports.clearCart = async (req, res) => {
  try {
    const userId = req.user._id;

    const result = await Cart.deleteMany({ userId });

    res.json({
      message: "Cart cleared successfully",
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("Clear Cart Error:", error);
    res.status(500).json({
      error: "Failed to clear cart",
    });
  }
};
