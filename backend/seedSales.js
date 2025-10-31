require('dotenv').config();
const mongoose = require('mongoose');
const Sale = require('./models/Sale');
const Product = require('./models/Product');
const User = require('./models/User');
const InventoryLog = require('./models/InventoryLog');

async function seedSales() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Get users
    const admin = await User.findOne({ role: 'admin' });
    const cashier = await User.findOne({ role: 'cashier' });
    
    if (!admin || !cashier) {
      console.log('Users not found. Please run: npm run setup');
      process.exit(1);
    }

    // Get all products
    const products = await Product.find({ active: true }).limit(10);
    
    if (products.length === 0) {
      console.log('No products found. Please run: npm run seed');
      process.exit(1);
    }

    console.log(`Found ${products.length} products to create sales with`);

    // Clear existing sales
    await Sale.deleteMany({});
    console.log('Cleared existing sales');

    // Create sales for the last 7 days
    const sales = [];
    const paymentMethods = ['cash', 'card', 'other'];
    
    for (let daysAgo = 7; daysAgo >= 0; daysAgo--) {
      const salesPerDay = Math.floor(Math.random() * 5) + 3; // 3-7 sales per day
      
      for (let i = 0; i < salesPerDay; i++) {
        const numItems = Math.floor(Math.random() * 3) + 1; // 1-3 items per sale
        const items = [];
        let subtotal = 0;

        for (let j = 0; j < numItems; j++) {
          const product = products[Math.floor(Math.random() * products.length)];
          const quantity = Math.floor(Math.random() * 3) + 1; // 1-3 quantity
          const itemSubtotal = product.price * quantity;
          
          items.push({
            product: product._id,
            quantity: quantity,
            priceAtSale: product.price,
            subtotal: itemSubtotal
          });
          
          subtotal += itemSubtotal;
        }

        const tax = subtotal * 0.1; // 10% tax
        const total = subtotal + tax;
        const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
        
        // Create sale with date in the past
        const saleDate = new Date();
        saleDate.setDate(saleDate.getDate() - daysAgo);
        saleDate.setHours(Math.floor(Math.random() * 12) + 8); // Between 8am and 8pm
        saleDate.setMinutes(Math.floor(Math.random() * 60));

        const sale = new Sale({
          cashier: cashier._id, // Only use cashier (admins don't sell)
          items,
          subtotal,
          tax,
          discount: 0,
          total,
          paymentMethod,
          paymentStatus: 'completed'
        });

        // Set custom date
        sale.createdAt = saleDate;
        sale.updatedAt = saleDate;

        // Save without triggering post hooks (to avoid stock updates for historical data)
        await sale.save({ timestamps: false });
        
        console.log(`Created sale for ${saleDate.toDateString()}`);
        sales.push(sale);
      }
    }

    console.log(`\n✅ Successfully created ${sales.length} dummy sales!`);
    console.log('\nSales distribution:');
    console.log('- Last 7 days of sales data');
    console.log('- 3-7 sales per day');
    console.log('- 1-3 items per sale');
    console.log('- Mixed payment methods (cash, card, other)');
    console.log('- All sales attributed to cashier user only');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding sales:', error);
    process.exit(1);
  }
}

seedSales();
