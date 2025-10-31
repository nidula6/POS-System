const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  sku: {
    type: String,
    required: true,
    unique: true
  },
  category: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  cost: {
    type: Number,
    required: true,
    min: 0
  },
  stockQuantity: {
    type: Number,
    required: true,
    min: 0
  },
  minStockLevel: {
    type: Number,
    required: true,
    default: 10
  },
  description: {
    type: String,
    trim: true
  },
  image: {
    type: String
  },
  active: {
    type: Boolean,
    default: true
  },
  barcode: {
    type: String,
    unique: true,
    sparse: true  // Allow multiple null values
  }
}, {
  timestamps: true
});

// Index for faster searches
productSchema.index({ name: 'text', sku: 'text', barcode: 'text' });

const Product = mongoose.model('Product', productSchema);
module.exports = Product;