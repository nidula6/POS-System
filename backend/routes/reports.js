const express = require('express');
const router = express.Router();
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const InventoryLog = require('../models/InventoryLog');
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

// Get profit and expense report
router.get('/profit-expense', auth, authorize('admin'), async (req, res) => {
  try {
    const { start, end } = req.query;
    
    const startDate = start ? new Date(start) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = end ? new Date(end) : new Date();
    endDate.setHours(23, 59, 59, 999);

    const sales = await Sale.find({
      createdAt: { $gte: startDate, $lte: endDate },
      paymentStatus: 'completed'
    }).populate('items.product');

    // Calculate profit
    let totalRevenue = 0;
    let totalCost = 0;
    const dailyProfit = {};

    for (const sale of sales) {
      const date = sale.createdAt.toISOString().split('T')[0];
      
      if (!dailyProfit[date]) {
        dailyProfit[date] = {
          date,
          revenue: 0,
          cost: 0,
          profit: 0,
          margin: 0
        };
      }

      let saleCost = 0;
      for (const item of sale.items) {
        if (item.product) {
          const itemCost = item.product.cost * item.quantity;
          saleCost += itemCost;
        }
      }

      dailyProfit[date].revenue += sale.total;
      dailyProfit[date].cost += saleCost;
      dailyProfit[date].profit += (sale.total - saleCost);
      
      totalRevenue += sale.total;
      totalCost += saleCost;
    }

    // Calculate margins
    Object.values(dailyProfit).forEach(day => {
      day.margin = day.revenue > 0 ? ((day.profit / day.revenue) * 100).toFixed(2) : 0;
    });

    const totalProfit = totalRevenue - totalCost;
    const profitMargin = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(2) : 0;

    res.json({
      summary: {
        totalRevenue: totalRevenue.toFixed(2),
        totalCost: totalCost.toFixed(2),
        totalProfit: totalProfit.toFixed(2),
        profitMargin: profitMargin
      },
      dailyData: Object.values(dailyProfit)
    });
  } catch (error) {
    console.error('Profit/Expense error:', error);
    res.status(500).json({ error: 'Error fetching profit and expense data' });
  }
});

// Get inventory movement report
router.get('/inventory-movement', auth, authorize('admin'), async (req, res) => {
  try {
    const { start, end, productId } = req.query;
    
    const startDate = start ? new Date(start) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = end ? new Date(end) : new Date();
    endDate.setHours(23, 59, 59, 999);

    const query = {
      createdAt: { $gte: startDate, $lte: endDate }
    };

    if (productId) {
      query.product = productId;
    }

    const movements = await InventoryLog.find(query)
      .populate('product', 'name sku')
      .populate('performedBy', 'name username')
      .sort({ createdAt: -1 });

    // Summary by type
    const summary = {
      purchase: 0,
      sale: 0,
      adjustment: 0,
      return: 0
    };

    movements.forEach(movement => {
      if (summary[movement.type] !== undefined) {
        summary[movement.type] += Math.abs(movement.quantity);
      }
    });

    res.json({
      movements,
      summary
    });
  } catch (error) {
    console.error('Inventory movement error:', error);
    res.status(500).json({ error: 'Error fetching inventory movement data' });
  }
});

// Get sales by user (Activity tracking - who sold what)
// Only includes cashier users, excludes admin data
router.get('/sales-by-user', auth, authorize('admin'), async (req, res) => {
  try {
    const { start, end } = req.query;
    
    const startDate = start ? new Date(start) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = end ? new Date(end) : new Date();
    endDate.setHours(23, 59, 59, 999);

    const salesByUser = await Sale.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          paymentStatus: 'completed'
        }
      },
      {
        $group: {
          _id: '$cashier',
          totalSales: { $sum: '$total' },
          salesCount: { $sum: 1 },
          totalItems: { $sum: { $size: '$items' } }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      {
        $unwind: '$userInfo'
      },
      {
        $match: {
          'userInfo.role': 'cashier'  // Only include cashier users
        }
      },
      {
        $project: {
          _id: 1,
          totalSales: 1,
          salesCount: 1,
          totalItems: 1,
          averageSale: { $divide: ['$totalSales', '$salesCount'] },
          userName: '$userInfo.name',
          username: '$userInfo.username',
          role: '$userInfo.role'
        }
      },
      {
        $sort: { totalSales: -1 }
      }
    ]);

    res.json(salesByUser);
  } catch (error) {
    console.error('Sales by user error:', error);
    res.status(500).json({ error: 'Error fetching sales by user' });
  }
});

module.exports = router;