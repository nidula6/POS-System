require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');
const InventoryLog = require('./models/InventoryLog');
const User = require('./models/User');

const dummyProducts = [
  { name: 'Coca Cola 500ml', sku: 'BEV001', barcode: '049000050103', category: 'Beverages', price: 1.99, cost: 0.99, stockQuantity: 150, minStockLevel: 20 },
  { name: 'Pepsi 500ml', sku: 'BEV002', barcode: '012000161551', category: 'Beverages', price: 1.99, cost: 0.99, stockQuantity: 120, minStockLevel: 20 },
  { name: 'Sprite 500ml', sku: 'BEV003', barcode: '049000028904', category: 'Beverages', price: 1.99, cost: 0.99, stockQuantity: 100, minStockLevel: 20 },
  { name: 'Red Bull Energy Drink', sku: 'BEV004', barcode: '611269991123', category: 'Beverages', price: 3.49, cost: 2.00, stockQuantity: 80, minStockLevel: 15 },
  { name: 'Bottled Water 1L', sku: 'BEV005', barcode: '073416001011', category: 'Beverages', price: 0.99, cost: 0.40, stockQuantity: 200, minStockLevel: 30 },
  
  { name: 'Lays Classic Chips', sku: 'SNK001', barcode: '028400010092', category: 'Snacks', price: 2.49, cost: 1.20, stockQuantity: 100, minStockLevel: 15 },
  { name: 'Doritos Nacho Cheese', sku: 'SNK002', barcode: '028400010108', category: 'Snacks', price: 2.79, cost: 1.40, stockQuantity: 90, minStockLevel: 15 },
  { name: 'Pringles Original', sku: 'SNK003', barcode: '038000845734', category: 'Snacks', price: 3.29, cost: 1.80, stockQuantity: 75, minStockLevel: 10 },
  { name: 'Oreo Cookies', sku: 'SNK004', barcode: '044000032098', category: 'Snacks', price: 3.99, cost: 2.00, stockQuantity: 60, minStockLevel: 10 },
  { name: 'Snickers Bar', sku: 'SNK005', barcode: '040000502227', category: 'Snacks', price: 1.29, cost: 0.60, stockQuantity: 150, minStockLevel: 25 },
  
  { name: 'White Bread Loaf', sku: 'BKY001', barcode: '007874220675', category: 'Bakery', price: 2.99, cost: 1.50, stockQuantity: 40, minStockLevel: 10 },
  { name: 'Wheat Bread Loaf', sku: 'BKY002', barcode: '007874220682', category: 'Bakery', price: 3.49, cost: 1.80, stockQuantity: 35, minStockLevel: 10 },
  { name: 'Croissant (Pack of 4)', sku: 'BKY003', barcode: '007874231011', category: 'Bakery', price: 4.99, cost: 2.50, stockQuantity: 25, minStockLevel: 5 },
  { name: 'Bagels (Pack of 6)', sku: 'BKY004', barcode: '007874231028', category: 'Bakery', price: 3.99, cost: 2.00, stockQuantity: 30, minStockLevel: 8 },
  { name: 'Donuts (Pack of 6)', sku: 'BKY005', barcode: '007874231035', category: 'Bakery', price: 5.99, cost: 3.00, stockQuantity: 20, minStockLevel: 5 },
  
  { name: 'Fresh Milk 1L', sku: 'DRY001', barcode: '004122000013', category: 'Dairy', price: 3.49, cost: 2.00, stockQuantity: 50, minStockLevel: 15 },
  { name: 'Cheddar Cheese 200g', sku: 'DRY002', barcode: '002113210126', category: 'Dairy', price: 4.99, cost: 2.80, stockQuantity: 40, minStockLevel: 10 },
  { name: 'Greek Yogurt 500g', sku: 'DRY003', barcode: '005030009543', category: 'Dairy', price: 3.99, cost: 2.20, stockQuantity: 45, minStockLevel: 12 },
  { name: 'Butter 250g', sku: 'DRY004', barcode: '004122000020', category: 'Dairy', price: 4.49, cost: 2.50, stockQuantity: 35, minStockLevel: 10 },
  { name: 'Eggs (Dozen)', sku: 'DRY005', barcode: '007387241001', category: 'Dairy', price: 3.99, cost: 2.00, stockQuantity: 60, minStockLevel: 15 },
  
  { name: 'Bananas (per lb)', sku: 'FRT001', barcode: '004011001234', category: 'Fruits', price: 0.79, cost: 0.40, stockQuantity: 100, minStockLevel: 20 },
  { name: 'Apples (per lb)', sku: 'FRT002', barcode: '004131001235', category: 'Fruits', price: 1.49, cost: 0.80, stockQuantity: 80, minStockLevel: 15 },
  { name: 'Oranges (per lb)', sku: 'FRT003', barcode: '003383801236', category: 'Fruits', price: 1.29, cost: 0.70, stockQuantity: 75, minStockLevel: 15 },
  { name: 'Strawberries (Pack)', sku: 'FRT004', barcode: '003338380123', category: 'Fruits', price: 3.99, cost: 2.20, stockQuantity: 40, minStockLevel: 10 },
  { name: 'Grapes (per lb)', sku: 'FRT005', barcode: '004030001237', category: 'Fruits', price: 2.49, cost: 1.40, stockQuantity: 60, minStockLevel: 12 }
];

async function seedProducts() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Find or create admin user for inventory logs
    let adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      console.log('No admin user found. Creating default admin...');
      adminUser = await User.create({
        username: 'admin',
        password: 'admin123',
        role: 'admin',
        name: 'System Administrator',
        email: 'admin@pos.com'
      });
    }

    // Clear existing products
    await Product.deleteMany({});
    await InventoryLog.deleteMany({});
    console.log('Cleared existing products and inventory logs');

    // Insert dummy products
    for (const productData of dummyProducts) {
      const product = await Product.create(productData);
      
      // Create initial inventory log
      await InventoryLog.create({
        product: product._id,
        type: 'purchase',
        quantity: productData.stockQuantity,
        previousStock: 0,
        newStock: productData.stockQuantity,
        reference: 'Initial Stock',
        performedBy: adminUser._id
      });
      
      console.log(`Created product: ${product.name}`);
    }

    console.log('\n✅ Successfully imported 25 dummy products!');
    console.log('\nProducts by category:');
    console.log('- Beverages: 5 products');
    console.log('- Snacks: 5 products');
    console.log('- Bakery: 5 products');
    console.log('- Dairy: 5 products');
    console.log('- Fruits: 5 products');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding products:', error);
    process.exit(1);
  }
}

seedProducts();
