const bcrypt = require('bcryptjs');
const { User, Product, Order, Category } = require('../config/db');
const { generateUserToken } = require('../middleware/auth');
const { generateAdminToken } = require('../middleware/admin');
const crypto = require('crypto');
const EmailService = require('../services/emailService');
const { OAuth2Client } = require('google-auth-library');

// Unified Login
exports.unifiedLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email and password are required'
      });
    }
    
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    
    if (!user) {
      return res.status(401).json({ 
        error: 'Invalid email or password' 
      });
    }
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        error: 'Invalid email or password' 
      });
    }
    
    const userResponse = user.toObject();
    delete userResponse.password;
    
    let token;
    let loginType;
    
    if (user.role === 'admin') {
      token = generateAdminToken(user._id.toString());
      loginType = 'admin';
    } else {
      token = generateUserToken(user._id.toString());
      loginType = 'user';
    }
    
    res.json({
      message: `Login successful!`,
      token,
      user: userResponse,
      loginType,
      role: user.role
    });
    
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ 
      error: 'Login failed. Please try again.' 
    });
  }
};

// User Registration (UPDATED)
exports.register = async (req, res) => {
  try {
    const { email, password, confirmPassword, firstName, lastName, phone } = req.body;
    
    // Check if passwords match
    if (password !== confirmPassword) {
      return res.status(400).json({ 
        error: 'Password and confirm password do not match'
      });
    }
    
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ 
        error: 'First name, last name, email and password are required'
      });
    }

    if(phone.length!=10){
      return res.stats(401).json({error:"Phone No Length Should be Ten"})
    }
    
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(409).json({ 
        error: 'User already exists with this email' 
      });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone ? phone.trim() : '',
      role: 'customer'
    });
    
    const token = generateUserToken(user._id.toString());
    
    const userResponse = user.toObject();
    delete userResponse.password;
    
    res.status(201).json({
      message: 'User registered successfully!',
      token,
      user: userResponse
    });
    
  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ 
      error: 'Registration failed. Please try again.' 
    });
  }
};

// Get Profile (UPDATED)
exports.getProfile = async (req, res) => {
  try {
    const user = req.user;
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userResponse = user.toObject();
    delete userResponse.password;

    if (user.role === 'admin') {
      const stats = {
        totalUsers: await User.countDocuments({ role: 'customer' }),
        totalProducts: await Product.countDocuments(),
        totalOrders: await Order.countDocuments(),
        totalCategories: await Category.countDocuments(),
        pendingOrders: await Order.countDocuments({ status: 'pending' }),
        lowStockProducts: await Product.countDocuments({ stock: { $lt: 10 } })
      };
      
      return res.json({
        message: 'Admin profile retrieved successfully',
        user: userResponse,
        stats,
        role: 'admin'
      });
    }

    res.json({
      message: 'Profile retrieved successfully',
      user: userResponse,
      role: 'user'
    });

  } catch (error) {
    console.error('Get Profile Error:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve profile' 
    });
  }
};

// Update Profile (UPDATED)
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const { firstName, lastName, phone, address } = req.body;

    if(phone.length!=10){
      return res.stats(401).json({error:"Phone No Length Should be Ten"})
    }

    const updateData = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (phone) updateData.phone = phone;
    if (address) updateData.address = address;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ 
        error: 'No data provided for update' 
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: 'Profile updated successfully',
      user
    });

  } catch (error) {
    console.error('Update Profile Error:', error);
    res.status(500).json({ 
      error: 'Failed to update profile' 
    });
  }
};

// Change Password
exports.changePassword = async (req, res) => {
  try {
    const userId = req.user._id;
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ 
        error: 'Current password, new password and confirm password are required' 
      });
    }

    // Check if new passwords match
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ 
        error: 'New password and confirm password do not match' 
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        error: 'New password must be at least 6 characters long' 
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ 
        error: 'Current password is incorrect' 
      });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await User.findByIdAndUpdate(userId, { 
      password: hashedNewPassword,
      updatedAt: new Date()
    });

    res.json({
      message: 'Password changed successfully',
      user: {
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      }
    });

  } catch (error) {
    console.error('Change Password Error:', error);
    res.status(500).json({ 
      error: 'Failed to change password'
    });
  }
};

// Logout
exports.logout = async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Logout successful!',
      logout: true,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Logout Error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Logout failed' 
    });
  }
};

// Forgot Password - Generate reset token and send email
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    console.log("email ===>>",email)

    console.log('=== ðŸ” FORGOT PASSWORD DEBUG START ===');
    console.log('1. ðŸ“§ Request received for email:', email);
    
    if (!email) {
      console.log('âŒ No email provided');
      return res.status(400).json({ 
        error: 'Email is required' 
      });
    }
    
    console.log('2. ðŸ” Searching user in database...');
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    
    if (!user) {
      console.log('3. âŒ User NOT found in database:', email);
      console.log('=== ðŸ” FORGOT PASSWORD DEBUG END ===');
      return res.json({ 
        message: 'If the email exists, a password reset link has been sent to your email address.'
      });
    }
    
    console.log('3. âœ… User FOUND:', {
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      id: user._id
    });
    
    // Generate reset token
    console.log('4. ðŸ”‘ Generating reset token...');
    user.resetPasswordToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordExpires = Date.now() + 3600000;
    await user.save();
    
    console.log('5. ðŸ’¾ User saved with reset token');
    console.log('6. ðŸ“¤ Calling EmailService...');
    
    // Send password reset email
    const emailSent = await EmailService.sendPasswordResetEmail(user, user.resetPasswordToken);
    
    console.log('7. ðŸ“§ EmailService result:', emailSent ? 'âœ… SUCCESS' : 'âŒ FAILED');
    
    if (!emailSent) {
      console.log('=== ðŸ” FORGOT PASSWORD DEBUG END ===');
      return res.status(500).json({ 
        error: 'Failed to send password reset email. Please try again.' 
      });
    }
    
    console.log('8. âœ… Returning success response');
    console.log('=== ðŸ” FORGOT PASSWORD DEBUG END ===');
    
    res.json({
      message: 'Password reset link has been sent to your email address.',
      note: 'Please check your inbox and spam folder. The link expires in 1 hour.'
    });
    
  } catch (error) {
    console.error('âŒ Forgot Password Error:', error);
    console.log('=== ðŸ” FORGOT PASSWORD DEBUG END ===');
    res.status(500).json({ 
      error: 'Failed to process password reset request' 
    });
  }
};

// Reset Password - Use token to set new password
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;
    
    if (!token) {
      return res.status(400).json({ 
        error: 'Reset token is required' 
      });
    }
    
    if (!password || !confirmPassword) {
      return res.status(400).json({ 
        error: 'Password and confirm password are required' 
      });
    }
    
    if (password !== confirmPassword) {
      return res.status(400).json({ 
        error: 'Password and confirm password do not match' 
      });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ 
        error: 'Password must be at least 6 characters long' 
      });
    }
    
    // Find user with valid reset token
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });
    
    if (!user) {
      return res.status(400).json({ 
        error: 'Invalid or expired reset token' 
      });
    }
    
    // Hash new password and update user
    const hashedPassword = await bcrypt.hash(password, 10);
    
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    user.updatedAt = new Date();
    
    await user.save();
    
    res.json({
      message: 'Password reset successfully! You can now login with your new password.',
      user: {
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      }
    });
    
  } catch (error) {
    console.error('Reset Password Error:', error);
    res.status(500).json({ 
      error: 'Failed to reset password' 
    });
  }
};

// Verify Reset Token
exports.verifyResetToken = async (req, res) => {
  try {
    const { token } = req.params;
    
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });
    
    if (!user) {
      return res.status(400).json({ 
        valid: false,
        error: 'Invalid or expired reset token' 
      });
    }
    
    res.json({
      valid: true,
      message: 'Reset token is valid',
      email: user.email
    });
    
  } catch (error) {
    console.error('Verify Token Error:', error);
    res.status(500).json({ 
      valid: false,
      error: 'Failed to verify reset token' 
    });
  }
};






const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

exports.googleCallback = async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Authorization code is required' });
    }

    // Exchange code for tokens
    const { tokens } = await googleClient.getToken(code);
    googleClient.setCredentials(tokens);

    // Verify the ID token
    const ticket = await googleClient.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, given_name, family_name, picture, sub: googleId } = payload;

    // Find or create user
    let user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      user = await User.create({
        email: email.toLowerCase(),
        firstName: given_name,
        lastName: family_name || '',
        avatar: picture,
        googleId,
        phone: '',
        isVerified: true,
        password: crypto.randomBytes(32).toString('hex'), // random password
        role: 'customer',
      });
      console.log('✅ New Google user created:', email);
    } else {
      // Update Google info on existing user
      user.googleId = googleId;
      if (picture) user.avatar = picture;
      await user.save();
      console.log('✅ Existing user logged in via Google:', email);
    }

    // Generate JWT (reuse your existing function)
    const token = generateUserToken(user._id.toString());

    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({
      message: 'Google login successful',
      token,
      user: userResponse,
      loginType: 'google',
      role: user.role,
    });

  } catch (error) {
    console.error('❌ Google callback error:', error);
    res.status(500).json({ error: 'Google authentication failed' });
  }
};