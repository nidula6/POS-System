const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema({
  saleNumber: {
    type: String,
    unique: true,
    sparse: true  // Allow null/undefined temporarily during creation
  },
  cashier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    priceAtSale: {
      type: Number,
      required: true
    },
    subtotal: {
      type: Number,
      required: true
    }
  }],
  subtotal: {
    type: Number,
    required: true
  },
  tax: {
    type: Number,
    required: true,
    default: 0
  },
  discount: {
    type: Number,
    default: 0
  },
  total: {
    type: Number,
    required: true
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ['cash', 'card', 'other']
  },
  paymentStatus: {
    type: String,
    required: true,
    enum: ['pending', 'completed', 'refunded'],
    default: 'completed'
  },
  refundReason: {
    type: String
  }
}, {
  timestamps: true
});

// Generate sale number before saving
saleSchema.pre('save', async function(next) {
  if (this.isNew && !this.saleNumber) {
    try {
      const date = new Date();
      const year = date.getFullYear().toString().slice(-2);
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      
      // Find the last sale of the day
      const lastSale = await this.constructor.findOne({
        saleNumber: new RegExp(`^${year}${month}${day}`)
      }).sort({ saleNumber: -1 });
      
      let sequence = '001';
      if (lastSale && lastSale.saleNumber) {
        const lastSequence = parseInt(lastSale.saleNumber.slice(-3));
        sequence = (lastSequence + 1).toString().padStart(3, '0');
      }
      
      this.saleNumber = `${year}${month}${day}${sequence}`;
    } catch (error) {
      console.error('Error generating sale number:', error);
      // Fallback: generate a unique sale number with timestamp
      const timestamp = Date.now().toString().slice(-9);
      this.saleNumber = `ERR${timestamp}`;
    }
  }
  next();
});

// Update product stock after sale
saleSchema.post('save', async function(doc) {
  try {
    const Product = mongoose.model('Product');
    const InventoryLog = mongoose.model('InventoryLog');
    
    for (const item of doc.items) {
      const product = await Product.findById(item.product);
      if (product) {
        const previousStock = product.stockQuantity;
        product.stockQuantity -= item.quantity;
        await product.save();
        
        // Create inventory log
        await InventoryLog.create({
          product: item.product,
          type: 'sale',
          quantity: -item.quantity,
          previousStock: previousStock,
          newStock: product.stockQuantity,
          reference: `Sale #${doc.saleNumber}`,
          performedBy: doc.cashier
        });
      }
    }
  } catch (error) {
    console.error('Error updating stock after sale:', error);
  }
});

const Sale = mongoose.model('Sale', saleSchema);
module.exports = Sale;