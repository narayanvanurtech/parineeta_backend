require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Adjust the path based on your project structure
    const User = require('./src/models/User');
    
    const ADMIN_EMAIL = 'admin@ecommerce.com';
    const ADMIN_PASSWORD = 'Admin123!';
    
    console.log('Creating admin user with correct schema...');
    
    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: ADMIN_EMAIL });
    
    if (existingAdmin) {
      console.log('❌ Admin already exists:');
      console.log('   Email:', existingAdmin.email);
      console.log('   Role:', existingAdmin.role);
      console.log('   ID:', existingAdmin._id);
      await mongoose.disconnect();
      return;
    }
    
    // Create admin user - FIXED to match schema
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
    
    const admin = await User.create({
      email: ADMIN_EMAIL,
      password: hashedPassword,
      firstName: 'Super',      // ✅ Now matches schema
      lastName: 'Admin',       // ✅ Now matches schema
      role: 'admin'
    });
    
    console.log('✅ ADMIN USER CREATED SUCCESSFULLY!');
    console.log('   Email:', ADMIN_EMAIL);
    console.log('   Password:', ADMIN_PASSWORD);
    console.log('   Full Name:', admin.firstName + ' ' + admin.lastName);
    console.log('   ID:', admin._id);
    console.log('   Role:', admin.role);
    
    console.log('🔑 Use these credentials to login as admin');
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
    process.exit(1);
  }
};



createAdmin();
