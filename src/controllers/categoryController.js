const { Category, Product } = require('../config/db');

// Get all categories
exports.getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find({}).sort({ name: 1 });

    res.json({
      message: 'Categories retrieved successfully',
      categories,
      total: categories.length
    });

  } catch (error) {
    console.error('Get Categories Error:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve categories' 
    });
  }
};

// Get category by ID
exports.getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ 
        error: 'Category not found' 
      });
    }

    res.json({
      message: 'Category retrieved successfully',
      category
    });

  } catch (error) {
    console.error('Get Category Error:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve category' 
    });
  }
};

// Create category (Admin only)
exports.createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ 
        error: 'Category name is required' 
      });
    }

    const existingCategory = await Category.findOne({ 
      name: { $regex: new RegExp(`^${name}$`, 'i') } 
    });

    if (existingCategory) {
      return res.status(400).json({ 
        error: 'Category already exists' 
      });
    }

    const category = new Category({
      name: name.trim(),
      description: description || ''
    });

    await category.save();

    res.status(201).json({
      message: 'Category created successfully',
      category
    });

  } catch (error) {
    console.error('Create Category Error:', error);
    res.status(500).json({ 
      error: 'Failed to create category'
    });
  }
};

// Update category (Admin only)
exports.updateCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { 
        name, 
        description,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    );

    if (!category) {
      return res.status(404).json({ 
        error: 'Category not found' 
      });
    }

    res.json({
      message: 'Category updated successfully',
      category
    });

  } catch (error) {
    console.error('Update Category Error:', error);
    res.status(500).json({ 
      error: 'Failed to update category' 
    });
  }
};

// Get products by category
exports.getProductsByCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({ 
        error: 'Category not found' 
      });
    }

    const products = await Product.find({ category: category.name });

    res.json({
      message: 'Products retrieved successfully',
      category: {
        _id: category._id,
        name: category.name,
        description: category.description
      },
      products,
      total: products.length
    });

  } catch (error) {
    console.error('Get Products by Category Error:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve products'
    });
  }
};

// Delete category (Admin only)
exports.deleteCategory = async (req, res) => {
  try {
    const categoryId = req.params.id;

    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ 
        error: 'Category not found' 
      });
    }

    // const productsInCategory = await Product.countDocuments({ 
    //   category: category.name 
    // });

    // console.log(productsInCategory)

    // if (productsInCategory > 0) {
    //   return res.status(400).json({
    //     error: 'Cannot delete category with associated products',
    //     productsCount: productsInCategory,
    //     suggestion: 'Reassign or delete the products first'
    //   });
    // }

    await Category.findByIdAndDelete(categoryId);

    res.json({
      message: 'Category deleted successfully',
      deletedCategory: category
    });

  } catch (error) {
    console.error('Delete Category Error:', error);
    res.status(500).json({ 
      error: 'Failed to delete category' 
    });
  }
};