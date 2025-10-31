const express = require('express');
const router = express.Router();
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const { auth, authorize } = require('../middleware/auth');

// Get dashboard stats for admin
router.get('/admin/dashboard', auth, authorize('admin'), async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get today's sales
    const todaySales = await Sale.find({
      createdAt: { $gte: today },
      paymentStatus: 'completed'
    });

    const todayTotal = todaySales.reduce((sum, sale) => sum + sale.total, 0);

    // Get all sales total
    const allSales = await Sale.find({ paymentStatus: 'completed' });
    const totalSales = allSales.reduce((sum, sale) => sum + sale.total, 0);

    // Get low stock products
    const lowStockProducts = await Product.find({
      $expr: { $lte: ['$stockQuantity', '$minStockLevel'] },
      active: true
    });

    // Get total products
    const totalProducts = await Product.countDocuments({ active: true });

    // Payment method breakdown
    const paymentStats = {
      cash: allSales.filter(s => s.paymentMethod === 'cash').reduce((sum, s) => sum + s.total, 0),
      card: allSales.filter(s => s.paymentMethod === 'card').reduce((sum, s) => sum + s.total, 0),
      other: allSales.filter(s => s.paymentMethod === 'other').reduce((sum, s) => sum + s.total, 0)
    };

    res.json({
      stats: {
        totalSales,
        todaySales: todayTotal,
        lowStock: lowStockProducts.length,
        totalProducts
      },
      paymentStats
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Error fetching dashboard data' });
  }
});

// Get dashboard stats for cashier
router.get('/cashier/dashboard', auth, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get today's sales by this cashier
    const todaySales = await Sale.find({
      cashier: req.user._id,
      createdAt: { $gte: today },
      paymentStatus: 'completed'
    }).populate('items.product', 'name');

    const todayTotal = todaySales.reduce((sum, sale) => sum + sale.total, 0);
    const averageTransaction = todaySales.length > 0 ? todayTotal / todaySales.length : 0;

    // Get recent sales
    const recentSales = await Sale.find({
      cashier: req.user._id,
      paymentStatus: 'completed'
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('items.product', 'name');

    res.json({
      todayStats: {
        totalSales: todayTotal,
        totalTransactions: todaySales.length,
        averageTransaction
      },
      recentSales
    });
  } catch (error) {
    console.error('Cashier dashboard error:', error);
    res.status(500).json({ error: 'Error fetching dashboard data' });
  }
});

// Get sales reports with date range
router.get('/', auth, authorize('admin'), async (req, res) => {
  try {
    const { start, end } = req.query;
    
    const startDate = start ? new Date(start) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = end ? new Date(end) : new Date();
    endDate.setHours(23, 59, 59, 999);

    const sales = await Sale.find({
      createdAt: { $gte: startDate, $lte: endDate },
      paymentStatus: 'completed'
    }).sort({ createdAt: 1 });

    // Group by date
    const dailyData = {};
    sales.forEach(sale => {
      const date = sale.createdAt.toISOString().split('T')[0];
      if (!dailyData[date]) {
        dailyData[date] = {
          date,
          salesCount: 0,
          totalRevenue: 0
        };
      }
      dailyData[date].salesCount++;
      dailyData[date].totalRevenue += sale.total;
    });

    // Convert to array and add average
    const reportData = Object.values(dailyData).map(day => ({
      ...day,
      averageSale: day.salesCount > 0 ? day.totalRevenue / day.salesCount : 0
    }));

    res.json(reportData);
  } catch (error) {
    console.error('Reports error:', error);
    res.status(500).json({ error: 'Error fetching reports' });
  }
});

module.exports = router;