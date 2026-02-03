const fs = require("fs");
const path = require("path");
const Product = require("../models/Product");
const fileUpload = require("../services/multer");
const { v4: uuid } = require("uuid");

exports.createProduct = async (req, res) => {
  try {
    const { name, description, category, subcategory } = req.body;

    if (!name || !category) {
      return res.status(400).json({
        success: false,
        message: "Name and category are required",
      });
    }

    const product = await Product.create({
      name,
      description,
      category,
      subcategory,
      variants: [],
    });

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};



const deleteUploadedFiles = (files) => {
  if (files && files.length > 0) {
    files.forEach((file) => {
      const filePath = path.join(__dirname, "../../", file.path);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });
  }
};

exports.getAllProducts = async (req, res) => {
  try {
    const { color, size, category } = req.query;

    const filter = {};

    if (category) filter.category = category;
    if (color) filter.colors = color.toLowerCase();

    if (size) {
      filter["variants.sizes.size"] = size.toUpperCase();
    }

    const products = await Product.find(filter);

    res.json({
      success: true,
      total: products.length,
      products,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};



exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json({
      message: "Product retrieved successfully",
      product,
    });
  } catch (error) {
    console.error("Get Product Error:", error);
    res.status(500).json({ error: "Failed to retrieve product" });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const { name, description, category, subcategory } = req.body;

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        message: "Product not found",
        success: false,
      });
    }

    if (name !== undefined) product.name = name;
    if (description !== undefined) product.description = description;
    if (category !== undefined) product.category = category;
    if (subcategory !== undefined) product.subcategory = subcategory;

    await product.save();

    res.status(200).json({
      message: "Product updated successfully",
      product,
      success: true,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update product",
      success: false,
    });
  }
};


exports.deleteProduct = async (req, res) => {
  const { id } = req.params;
  try {
    if (!id) {
      return res
        .status(401)
        .json({ message: "Id is not Found !", success: false });
    }

    const product = await Product.findByIdAndDelete(id);

    res.status(201).json({
      message: "Product deleted successfully",
      deletedProduct: {
        id: product._id,
        name: product.name,
      },
      success: true,
    });
  } catch (error) {
    console.error("Delete Product Error:", error);
    res
      .status(500)
      .json({ message: "Failed to delete product", success: false });
  }
};

//Add Variant

exports.addVariant = async (req, res) => {
  try {
    const { productId } = req.params;
    const { color } = req.body;

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ error: "Product not found" });

    const normalizedColor = color.toLowerCase().trim();

    const exists = product.variants.some(
      (v) => v.color === normalizedColor
    );

    if (exists) {
      return res.status(400).json({
        error: "Variant color already exists",
      });
    }

    const images = req.files?.images || [];
    const uploaded = await Promise.all(
      images.map((file) =>
        fileUpload(file.buffer.toString("base64"), uuid())
      )
    );

    product.variants.push({
      color: normalizedColor,
      images: uploaded.map((i) => i.url),
      sizes: [],
    });

    await product.save();

    res.status(201).json({
      success: true,
      message: "Variant added successfully",
      variants: product.variants,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


exports.updateVariant = async (req, res) => {
  try {
    const { productId, variantId } = req.params;
    const { color, removedImages } = req.body;

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ error: "Product not found" });

    const variant = product.variants.id(variantId);
    if (!variant) return res.status(404).json({ error: "Variant not found" });

    if (color) {
      const newColor = color.toLowerCase().trim();

      const exists = product.variants.some(
        (v) => v._id.toString() !== variantId && v.color === newColor
      );

      if (exists) {
        return res.status(400).json({
          error: "Variant color already exists",
        });
      }

      variant.color = newColor;
    }

    if (removedImages) {
      const removed = Array.isArray(removedImages)
        ? removedImages
        : [removedImages];

      variant.images = variant.images.filter(
        (img) => !removed.includes(img)
      );
    }

    if (req.files?.images?.length) {
      const uploaded = await Promise.all(
        req.files.images.map((file) =>
          fileUpload(file.buffer.toString("base64"), uuid())
        )
      );

      variant.images.push(...uploaded.map((i) => i.url));
    }

    await product.save();

    res.status(200).json({
      message: "Variant updated successfully",
      variant,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


exports.deleteVariant = async (req, res) => {
  try {
    const { productId, variantId } = req.params;

    if (!productId || !variantId) {
      return res.status(400).json({
        success: false,
        message: "Product ID and Variant ID are required",
      });
    }

    const product = await Product.findByIdAndUpdate(
      productId,
      {
        $pull: { variants: { _id: variantId } },
      },
      { new: true },
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Variant deleted successfully",
    });
  } catch (error) {
    console.error("DELETE VARIANT ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete variant",
    });
  }
};



exports.getProductWithVariant = async (req, res) => {
  try {
    const { productId, variantId } = req.params;

    const product = await Product.findOne(
      { _id: productId, "variants._id": variantId },
      {
        name: 1,
        description: 1,
        category: 1,
        subcategory: 1,
        colors: 1,
        "variants.$": 1,
      }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product or variant not found",
      });
    }

    res.status(200).json({
      success: true,
      product,
      variant: product.variants[0],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

exports.addSizeToVariant = async (req, res) => {
  try {
    const { productId, variantId } = req.params;
    const { size, stock, price, discount } = req.body;

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ error: "Product not found" });

    const variant = product.variants.id(variantId);
    if (!variant) return res.status(404).json({ error: "Variant not found" });

    const exists = variant.sizes.some(
      (s) => s.size === size.toUpperCase()
    );

    if (exists) {
      return res.status(400).json({
        error: "Size already exists for this variant",
      });
    }

    variant.sizes.push({
      size,
      stock: Number(stock),
      price: Number(price),
      discount: Number(discount) || 0,
    });

    await product.save();

    res.status(201).json({
      success: true,
      message: "Size added successfully",
      variant,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};




