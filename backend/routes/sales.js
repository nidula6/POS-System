const express = require('express');
const router = express.Router();
const Sale = require('../models/Sale');
const { auth } = require('../middleware/auth');
const { createActivityLog } = require('./activityLogs');

// Create new sale
router.post('/', auth, async (req, res) => {
  try {
    const { items, subtotal, tax, discount, total, paymentMethod } = req.body;

    // Validate that all products exist and have enough stock
    const Product = require('../models/Product');
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(400).json({ error: `Product not found: ${item.product}` });
      }
      if (product.stockQuantity < item.quantity) {
        return res.status(400).json({ error: `Insufficient stock for ${product.name}` });
      }
    }

    const sale = new Sale({
      cashier: req.user._id,
      items,
      subtotal,
      tax,
      discount: discount || 0,
      total,
      paymentMethod,
      paymentStatus: 'completed'
    });

    await sale.save();

    // Populate product details for response
    await sale.populate('items.product');

    // Log sale creation activity
    await createActivityLog(
      req.user._id,
      'create_sale',
      `Created sale #${sale._id.toString().slice(-6)} - Total: $${total.toFixed(2)} (${items.length} items)`,
      'Sale',
      sale._id,
      { items: items.length, total, paymentMethod }
    );

    res.status(201).json({ sale });
  } catch (error) {
    console.error('Sale creation error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Get all sales (admin only)
router.get('/', auth, async (req, res) => {
  try {
    const sales = await Sale.find({})
      .populate('cashier', 'name username')
      .populate('items.product', 'name sku')
      .sort({ createdAt: -1 });
    
    res.json(sales);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching sales' });
  }
});

// Get sale by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id)
      .populate('cashier', 'name username')
      .populate('items.product');
    
    if (!sale) {
      return res.status(404).json({ error: 'Sale not found' });
    }
    
    res.json(sale);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching sale' });
  }
});

module.exports = router;