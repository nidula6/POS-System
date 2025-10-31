require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const createInitialUsers = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/posdb');
    console.log('✅ Connected to MongoDB');

    // Check if any users exist
    const existingUsers = await User.countDocuments();
    if (existingUsers > 0) {
      console.log('Users already exist. Skipping initial user creation.');
      process.exit(0);
    }

    // Create initial admin user
    const adminUser = new User({
      username: 'admin',
      password: 'admin123',
      name: 'System Administrator',
      email: 'admin@possystem.com',
      role: 'admin'
    });

    await adminUser.save();
    console.log('✅ Admin user created:');
    console.log('   Username: admin');
    console.log('   Password: admin123');
    console.log('   Role: admin');

    // Create initial cashier user
    const cashierUser = new User({
      username: 'cashier',
      password: 'cashier123',
      name: 'Cashier User',
      email: 'cashier@possystem.com',
      role: 'cashier'
    });

    await cashierUser.save();
    console.log('✅ Cashier user created:');
    console.log('   Username: cashier');
    console.log('   Password: cashier123');
    console.log('   Role: cashier');

    console.log('\n🎉 Initial users created successfully!');
    console.log('You can now log in to the system using these credentials.');

  } catch (error) {
    console.error('❌ Error creating initial users:', error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

createInitialUsers();