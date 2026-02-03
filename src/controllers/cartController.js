const { Cart, Product } = require('../config/db');

// Get user's cart
exports.getCart = async (req, res) => {
  try {
    const userId = req.user._id;

    const cartItems = await Cart.find({ userId }).populate(
      "productId",
      "name category subcategory variants"
    );

    let total = 0;
    let totalItems = 0;
    const formattedCart = [];

    for (const item of cartItems) {
      if (!item.productId) continue;

      const variant = item.productId.variants.id(item.variantId);
      if (!variant || !variant.sizes?.length) continue;

      // ✅ STEP 1: Resolve selected size SAFELY
      let selectedSize = null;

      // Case 1: size stored in cart (new logic)
      if (item.size && item.size._id) {
        selectedSize = variant.sizes.id(item.size._id);
      }

      // Case 2: fallback → first in-stock size
      if (!selectedSize) {
        selectedSize = variant.sizes.find((s) => s.stock > 0);
      }

      // Case 3: absolute fallback → first size
      if (!selectedSize) {
        selectedSize = variant.sizes[0];
      }

      if (!selectedSize) continue;

      // ✅ STEP 2: Price calculation
      const price =
        selectedSize.finalPrice !== undefined
          ? selectedSize.finalPrice
          : selectedSize.price;

      const subtotal = price * item.quantity;
      total += subtotal;
      totalItems += item.quantity;

      // ✅ STEP 3: Push formatted cart item
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
          images: variant.images,

          // 🔥 ALL sizes with selection info
          sizes: variant.sizes.map((s) => ({
            _id: s._id,
            size: s.size,
            stock: s.stock,
            price: s.price,
            discount: s.discount,
            finalPrice: s.finalPrice ?? s.price,
            isSelected:
              selectedSize &&
              s._id.toString() === selectedSize._id.toString(),
          })),
        },

        subtotal,

        // 🔥 frontend helper
        selectedSizeId: selectedSize._id,
      });
    }

    return res.status(200).json({
      success: true,
      cart: formattedCart,
      total,
      totalItems,
    });
  } catch (error) {
    console.error("Get Cart Error ❌", error);
    res.status(500).json({
      error: "Failed to retrieve cart",
    });
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

exports.updateCartItem = async (req, res) => {
  try {
    const { quantity, sizeId } = req.body; // ✅ now accepting sizeId
    const userId = req.user._id;
    const cartItemId = req.params.id;

    console.log(req.params.id,quantity,sizeId)

    // 🔹 Find cart item
    const cartItem = await Cart.findOne({ _id: cartItemId, userId }).populate("productId");

    if (!cartItem) {
      return res.status(404).json({ error: "Cart item not found" });
    }

    if (!cartItem.productId) {
      return res.status(404).json({ error: "Product not found" });
    }

    // 🔹 Find selected variant
    const variant = cartItem.productId.variants.id(cartItem.variantId);

    if (!variant) {
      return res.status(404).json({ error: "Variant not found" });
    }

    // 🔹 If sizeId is provided, validate and update it
    let selectedSize;
    if (sizeId) {
      selectedSize = variant.sizes.id(sizeId);
  console.log(sizeId)
      if (!selectedSize) {
        return res.status(404).json({ error: "Selected size not found" });
      }

      if (selectedSize.stock < 1) {
        return res.status(400).json({ error: "Selected size is out of stock" });
      }

      cartItem.size = {
        _id: selectedSize._id,
        size: selectedSize.size,
        price: selectedSize.price,
        discount: selectedSize.discount,
        finalPrice: selectedSize.finalPrice ?? selectedSize.price,
        stock: selectedSize.stock,
      };
    } else {
      // If no sizeId provided, fallback to existing size or first available
      selectedSize = cartItem.size || variant.sizes[0];
      cartItem.size = {
        _id: selectedSize._id,
        size: selectedSize.size,
        price: selectedSize.price,
        discount: selectedSize.discount,
        finalPrice: selectedSize.finalPrice ?? selectedSize.price,
        stock: selectedSize.stock,
      };
    }

    // 🔹 If quantity is provided, validate stock
    if (quantity) {
      if (quantity < 1) {
        return res.status(400).json({ error: "Quantity must be at least 1" });
      }

      if (quantity > selectedSize.stock) {
        return res.status(400).json({ error: "Insufficient stock", available: selectedSize.stock });
      }

      cartItem.quantity = quantity;
    }

    await cartItem.save();

    // 🔹 Calculate subtotal
    const subtotal = (selectedSize.finalPrice ?? selectedSize.price) * cartItem.quantity;
const reorderedSizes = variant.sizes.map((s) => ({
  _id: s._id,
  size: s.size,
  price: s.price,
  discount: s.discount,
  finalPrice: s.finalPrice ?? s.price,
  stock: s.stock,
  isSelected: s._id.toString() === cartItem.size._id.toString(),
}))
.sort((a, b) => (a.isSelected ? -1 : 0));

    res.json({
      success: true,
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
          images: variant.images,
          sizes:reorderedSizes
        },
        subtotal,
      },
    });
  } catch (error) {
    console.error("Update Cart Error:", error);
    res.status(500).json({ error: "Failed to update cart item" });
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
