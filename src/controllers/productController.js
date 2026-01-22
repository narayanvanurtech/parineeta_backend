const Product = require('../models/Product');
const fs = require('fs');
const path = require('path');

// Helper function to delete uploaded files
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

// Get all products with filters
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

// Get product by ID
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

// Create product with images (Admin only)
exports.createProduct = async (req, res) => {
  try {
    const { name, description, price, category, stock, sizes, colors } = req.body;

    console.log(name,description,price,category,stock,sizes,colors)
    // Validate all required fields
    const missingFields = {
      name: !name,
      price: !price,
      category: !category,
      stock: stock === undefined
    };

    const hasErrors = Object.values(missingFields).some(field => field === true);

    if (hasErrors) {
      // Delete uploaded files if validation fails
      if (req.files) {
        deleteUploadedFiles(req.files);
      }
      
      return res.status(400).json({
        error: 'All required fields must be provided',
        missingFields,
        requirements: {
          name: 'String, required',
          price: 'Number, required',
          category: 'String, required',
          stock: 'Number, required',
          sizes: 'Array of strings (optional)',
          colors: 'Array of strings (optional)',
          images: 'Files (optional, max 10)'
        }
      });
    }

    // Parse sizes and colors if they are strings
    let parsedSizes = sizes;
    let parsedColors = colors;

    if (typeof sizes === 'string') {
      try {
        parsedSizes = JSON.parse(sizes);
      } catch (e) {
        parsedSizes = sizes.split(',').map(s => s.trim());
      }
    }

    if (typeof colors === 'string') {
      try {
        parsedColors = JSON.parse(colors);
      } catch (e) {
        parsedColors = colors.split(',').map(c => c.trim());
      }
    }

    // Validate sizes if provided
    if (parsedSizes && Array.isArray(parsedSizes) && parsedSizes.length > 0) {
      const validSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
      const invalidSizes = parsedSizes.filter(size => !validSizes.includes(size.toUpperCase()));
      if (invalidSizes.length > 0) {
        if (req.files) {
          deleteUploadedFiles(req.files);
        }
        return res.status(400).json({
          error: 'Invalid sizes found',
          validSizes,
          invalidSizes,
        });
      }
    }

    // Get image paths from uploaded files
    const imagePaths = req.files ? req.files.map(file => `/${file.path.replace(/\\/g, '/')}`) : [];

    const product = new Product({
      name,
      description: description || '',
      price: Number(price),
      category,
      stock: Number(stock),
      sizes: parsedSizes && Array.isArray(parsedSizes) ? parsedSizes.map(size => size.toUpperCase()) : [],
      colors: parsedColors && Array.isArray(parsedColors) ? parsedColors.map(color => color.toLowerCase()) : [],
      images: imagePaths
    });

    await product.save();

    res.status(201).json({
      message: 'Product created successfully',
      product,
      uploadedImages: imagePaths.length
    });
  } catch (error) {
    console.error('Create Product Error:', error);
    
    // Delete uploaded files if product creation fails
    if (req.files) {
      deleteUploadedFiles(req.files);
    }
  
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Validation Error',
        details: Object.values(error.errors).map(err => ({
          field: err.path,
          message: err.message
        }))
      });
    }
    res.status(500).json({ 
      error: 'Failed to create product',
      details: error.message 
    });
  }
};

// Update product with images (Admin only)
exports.updateProduct = async (req, res) => {
  try {
    const { name, description, price, category, stock, sizes, colors, removeImages } = req.body;

    const product = await Product.findById(req.params.id);
    
    if (!product) {
      // Delete uploaded files if product not found
      if (req.files) {
        deleteUploadedFiles(req.files);
      }
      return res.status(404).json({ error: 'Product not found' });
    }

    // Parse sizes and colors if they are strings
    let parsedSizes = sizes;
    let parsedColors = colors;

    if (typeof sizes === 'string' && sizes) {
      try {
        parsedSizes = JSON.parse(sizes);
      } catch (e) {
        parsedSizes = sizes.split(',').map(s => s.trim());
      }
    }

    if (typeof colors === 'string' && colors) {
      try {
        parsedColors = JSON.parse(colors);
      } catch (e) {
        parsedColors = colors.split(',').map(c => c.trim());
      }
    }

    // Validate sizes if provided
    if (parsedSizes && Array.isArray(parsedSizes) && parsedSizes.length > 0) {
      const validSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
      const uniqueSizes = [...new Set(parsedSizes.map(size => size.toUpperCase()))];
      const invalidSizes = uniqueSizes.filter(size => !validSizes.includes(size));
      if (invalidSizes.length > 0) {
        if (req.files) {
          deleteUploadedFiles(req.files);
        }
        return res.status(400).json({
          error: 'Invalid sizes found',
          validSizes,
          invalidSizes,
        });
      }
    }

    // Handle image removal
    if (removeImages) {
      let imagesToRemove = [];
      try {
        imagesToRemove = typeof removeImages === 'string' ? JSON.parse(removeImages) : removeImages;
      } catch (e) {
        imagesToRemove = typeof removeImages === 'string' ? removeImages.split(',') : [];
      }

      if (Array.isArray(imagesToRemove) && imagesToRemove.length > 0) {
        // Delete files from filesystem
        imagesToRemove.forEach(imagePath => {
          const fullPath = path.join(__dirname, '../../', imagePath.replace(/^\//, ''));
          if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
          }
        });
        // Remove from product images array
        product.images = product.images.filter(img => !imagesToRemove.includes(img));
      }
    }

    // Add new images
    if (req.files && req.files.length > 0) {
      const newImagePaths = req.files.map(file => `/${file.path.replace(/\\/g, '/')}`);
      product.images = [...product.images, ...newImagePaths];
      
      // Limit to 10 images
      if (product.images.length > 10) {
        // Delete excess uploaded files
        const excessFiles = req.files.slice(10 - (product.images.length - req.files.length));
        deleteUploadedFiles(excessFiles);
        product.images = product.images.slice(0, 10);
      }
    }

    // Update other fields
    if (name) product.name = name;
    if (description !== undefined) product.description = description;
    if (price) product.price = Number(price);
    if (category) product.category = category;
    if (stock !== undefined) product.stock = Number(stock);
    if (parsedSizes && Array.isArray(parsedSizes)) {
      product.sizes = [...new Set(parsedSizes.map(size => size.toUpperCase()))];
    }
    if (parsedColors && Array.isArray(parsedColors)) {
      product.colors = [...new Set(parsedColors.map(color => color.toLowerCase()))];
    }
    product.updatedAt = new Date();

    await product.save();

    res.json({
      message: 'Product updated successfully',
      product,
      totalImages: product.images.length
    });
  } catch (error) {
    console.error('Update Product Error:', error);
    
    // Delete uploaded files if update fails
    if (req.files) {
      deleteUploadedFiles(req.files);
    }
    
    res.status(500).json({ error: 'Failed to update product' });
  }
};

// Delete product (Admin only)
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Delete associated images from filesystem
    if (product.images && product.images.length > 0) {
      product.images.forEach(imagePath => {
        const fullPath = path.join(__dirname, '../../', imagePath.replace(/^\//, ''));
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      });
    }

    await Product.findByIdAndDelete(req.params.id);

    res.json({
      message: 'Product deleted successfully',
      deletedProduct: {
        id: product._id,
        name: product.name,
        imagesDeleted: product.images.length
      }
    });
  } catch (error) {
    console.error('Delete Product Error:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
};