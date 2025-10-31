const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { auth, authorize } = require('../middleware/auth');
const InventoryLog = require('../models/InventoryLog');

// Get all products
router.get('/', auth, async (req, res) => {
  try {
    const products = await Product.find({});
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching products' });
  }
});

// Create new product (admin only)
router.post('/', auth, authorize('admin'), async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();

    // Create inventory log for initial stock
    await new InventoryLog({
      product: product._id,
      type: 'purchase',
      quantity: product.stockQuantity,
      previousStock: 0,
      newStock: product.stockQuantity,
      reference: 'Initial stock',
      performedBy: req.user._id
    }).save();

    res.status(201).json(product);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update product (admin only)
router.put('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const oldStock = product.stockQuantity;
    const updates = Object.keys(req.body);
    updates.forEach(update => product[update] = req.body[update]);
    await product.save();

    // Log inventory change if stock quantity was updated
    if (oldStock !== product.stockQuantity) {
      await new InventoryLog({
        product: product._id,
        type: 'adjustment',
        quantity: product.stockQuantity - oldStock,
        previousStock: oldStock,
        newStock: product.stockQuantity,
        reference: 'Manual adjustment',
        performedBy: req.user._id
      }).save();
    }

    res.json(product);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete product (admin only)
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Soft delete by setting active to false
    product.active = false;
    await product.save();

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get product by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching product' });
  }
});

// Get inventory history for a product (admin only)
router.get('/:id/inventory', auth, authorize('admin'), async (req, res) => {
  try {
    const logs = await InventoryLog.find({ product: req.params.id })
      .sort({ createdAt: -1 })
      .populate('performedBy', 'name');
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching inventory history' });
  }
});

// Update stock quantity (admin only)
router.post('/:id/stock', auth, authorize('admin'), async (req, res) => {
  try {
    const { quantity, type, reference } = req.body;
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const oldStock = product.stockQuantity;
    product.stockQuantity += parseInt(quantity);
    
    if (product.stockQuantity < 0) {
      return res.status(400).json({ error: 'Stock cannot be negative' });
    }

    await product.save();

    // Log the inventory change
    await new InventoryLog({
      product: product._id,
      type: type || 'adjustment',
      quantity: parseInt(quantity),
      previousStock: oldStock,
      newStock: product.stockQuantity,
      reference: reference || 'Stock adjustment',
      performedBy: req.user._id
    }).save();

    res.json(product);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;