const { User, Order } = require('../config/db');

// Get all users (Admin only)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });

    res.json({
      message: 'Users retrieved successfully',
      users,
      total: users.length,
      customers: users.filter(u => u.role === 'customer').length,
      admins: users.filter(u => u.role === 'admin').length
    });

  } catch (error) {
    console.error('Get All Users Error:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve users' 
    });
  }
};

// Get user by ID (Admin only)
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({ 
        error: 'User not found' 
      });
    }

    const userOrders = await Order.find({ userId: req.params.id });
    const userStats = {
      totalOrders: userOrders.length,
      totalSpent: userOrders.reduce((sum, order) => sum + order.total, 0),
      orderStatus: {
        pending: userOrders.filter(o => o.status === 'pending').length,
        processing: userOrders.filter(o => o.status === 'processing').length,
        shipped: userOrders.filter(o => o.status === 'shipped').length,
        delivered: userOrders.filter(o => o.status === 'delivered').length,
        cancelled: userOrders.filter(o => o.status === 'cancelled').length
      }
    };

    res.json({
      message: 'User retrieved successfully',
      user,
      stats: userStats
    });

  } catch (error) {
    console.error('Get User Error:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve user' 
    });
  }
};

// Delete user (Admin only)
exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;

    if (userId === req.user._id.toString()) {
      return res.status(400).json({ 
        error: 'Cannot delete your own account' 
      });
    }

    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ 
        error: 'User not found' 
      });
    }

    if (user.role === 'admin') {
      return res.status(403).json({ 
        error: 'Cannot delete admin users' 
      });
    }

    const userOrders = await Order.countDocuments({ userId });
    if (userOrders > 0) {
      return res.status(400).json({
        error: 'Cannot delete user with existing orders',
        ordersCount: userOrders,
        suggestion: 'Anonymize user data instead of deleting'
      });
    }

    await User.findByIdAndDelete(userId);

    res.json({
      message: 'User deleted successfully',
      deletedUser: {
        id: user._id,
        email: user.email,
        name: user.name
      }
    });

  } catch (error) {
    console.error('Delete User Error:', error);
    res.status(500).json({ 
      error: 'Failed to delete user' 
    });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { firstName, lastName, email, role ,phone} = req.body;
    const userId = req.params.id;

    if (!firstName || !lastName || !email) {
      return res.status(400).json({
        error: "First name, last name and email are required",
      });
    }

    // Check email conflict
    const existingUser = await User.findOne({
      email: email.toLowerCase().trim(),
      _id: { $ne: userId },
    });

    if (existingUser) {
      return res.status(409).json({
        error: "Email already in use by another user",
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.toLowerCase().trim(),
        role,
      },
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Update User Error:", error);
    res.status(500).json({
      error: "Failed to update user",
    });
  }
};
