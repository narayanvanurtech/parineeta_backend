
const fs = require('fs');
const path = require('path');
const Product = require('../models/Product');
const fileUpload = require('../services/multer');
const { v4: uuid } = require("uuid");


exports.createProduct = async (req, res) => {
  try {
    const { name, description, category,price , stock, sizes,subcategory } = req.body;

    if(!name || !description  || !category || !stock || !sizes || !price){
      return res.status(501).json({message:"All Fields Are Required !",success:false})
    }

    const product = await Product.create({
      name,
      description,
      category,
      subcategory,
      stock,
      sizes,
      price,
      variants: [],
      colors: [],
    });
    if(!product){
      return res.status(401).json({message:"Failed to Create Product !",success:false})
    }
    
    res.status(201).json({
      message: "Product created",
      product,
      success:true
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


const deleteUploadedFiles = (files) => {
  if (files && files.length > 0) {
    files.forEach(file => {
      const filePath = path.join(__dirname, '../../', file.path);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });
  }
};


exports.getAllProducts = async (req, res) => {
  try {
    const {
      minPrice,
      maxPrice,
      size,
      color,
      category,
      sort = 'createdAt',
      order = 'desc'
    } = req.query;

    const filter = {};

    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};
      if (minPrice !== undefined) filter.price.$gte = Number(minPrice);
      if (maxPrice !== undefined) filter.price.$lte = Number(maxPrice);
    }

    if (size) {
      filter.sizes = size.toUpperCase();
    }

    if (color) {
      filter.colors = color.toLowerCase();
    }

    if (category) {
      filter.category = category;
    }

    const sortObj = {};
    sortObj[sort] = order === 'desc' ? -1 : 1;

    const products = await Product.find(filter).sort(sortObj);
    
    res.json({
      message: 'Products retrieved successfully',
      products,
      total: products.length,
      filters: {
        appliedFilters: filter,
        sort,
        order
      }
    });
  } catch (error) {
    console.error('Get Products Error:', error);
    res.status(500).json({ error: 'Failed to retrieve products' });
  }
};


exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json({
      message: 'Product retrieved successfully',
      product
    });
  } catch (error) {
    console.error('Get Product Error:', error);
    res.status(500).json({ error: 'Failed to retrieve product' });
  }
};




exports.updateProduct = async (req, res) => {
  try {
    const { name, description, category, subcategory, price, stock, sizes } = req.body;

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
    if (price !== undefined) product.price = Number(price);
    if (stock !== undefined) product.stock = Number(stock);

   
    if (sizes !== undefined) {
      let parsedSizes = sizes;

      if (typeof sizes === "string") {
        try {
          parsedSizes = JSON.parse(sizes);
        } catch {
          parsedSizes = sizes.split(",").map(s => s.trim());
        }
      }

      product.sizes = parsedSizes;
    }


    product.updatedAt = new Date();
    await product.save();

    res.status(200).json({
      message: "Product updated successfully",
      product,
      success: true,
    });
  } catch (error) {
    console.error("Update Product Error:", error);
    res.status(500).json({
      message: "Failed to update product",
      success: false,
    });
  }
};


exports.deleteProduct = async (req, res) => {
 const {id} = req.params
  try {
   
    if(!id){
      return res.status(401).json({message:'Id is not Found !',success:false})
    }

const product  = await Product.findByIdAndDelete(id);

    res.status(201).json({
      message: 'Product deleted successfully',
      deletedProduct: {
        id: product._id,
        name: product.name,
      },
      success:true
    });
  } catch (error) {
    console.error('Delete Product Error:', error);
    res.status(500).json({ message: 'Failed to delete product',success:false });
  }
};


//Add Variant 

exports.addvariant = async (req, res) => {
  try {
    const { productId } = req.params;
    const { color, stock, price } = req.body;

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ error: "Product not found" });

    const newColor = color.toLowerCase();

    // Check if this color already exists in variants
    const colorExists = product.variants.some(
      (v) => v.color.toLowerCase() === newColor
    );

    if (colorExists) {
      return res.status(400).json({
        error: `Variant with color "${newColor}" already exists`,
      });
    }

    // Get images from multer fields
    const imageFiles = req.files.images || [];

    // Upload images
    const imageResults = await Promise.all(
      imageFiles.map((file) =>
        fileUpload(file.buffer.toString("base64"), uuid())
      )
    );

    const variant = {
      color: newColor,
      stock: Number(stock),
      price: price ? Number(price) : undefined,
      images: imageResults.map((img) => img.url),
    };

    product.variants.push(variant);

    // Sync colors array
    product.colors = [...new Set(product.variants.map((v) => v.color))];

    await product.save();

    res.status(201).json({
      message: "Variant added successfully",
      variant: variant,
    });
  } catch (error) {
    console.error("Add Variant Error:", error);
    res.status(500).json({ error: error.message });
  }
};


exports.updateVariant = async (req, res) => {
  try {
    const { productId, variantId } = req.params;
    const { color, stock, price, removedImages } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    const variant = product.variants.id(variantId);
    if (!variant) {
      return res.status(404).json({ error: "Variant not found" });
    }

   
    if (color) {
      const newColor = color.toLowerCase().trim();

      const colorExists = product.variants.some(
        (v) =>
          v._id.toString() !== variantId &&
          v.color.toLowerCase() === newColor
      );

      if (colorExists) {
        return res.status(400).json({
          error: `Variant with color "${newColor}" already exists`,
        });
      }

      variant.color = newColor;
    }

   
    if (stock !== undefined) variant.stock = Number(stock);
    if (price !== undefined) variant.price = Number(price);

 
    if (removedImages) {
      const removed = Array.isArray(removedImages)
        ? removedImages
        : [removedImages];

      variant.images = variant.images.filter(
        (img) => !removed.includes(img)
      );
    }

    if (req.files?.images?.length) {
      const uploadedImages = await Promise.all(
        req.files.images.map((file) =>
          fileUpload(file.buffer.toString("base64"), uuid())
        )
      );

      const newUrls = uploadedImages.map((img) => img.url);

      variant.images.push(...newUrls);
    }

   
    product.colors = [
      ...new Set(product.variants.map((v) => v.color)),
    ];

    await product.save();

    res.status(200).json({
      message: "Variant updated successfully",
      variant,
    });
  } catch (error) {
    console.error("Update Variant Error:", error);
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
      { new: true }
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


