const express = require('express');
const router = express.Router();
const ActivityLog = require('../models/ActivityLog');
const { auth, authorize } = require('../middleware/auth');

// Helper function to create activity log
const createActivityLog = async (userId, action, description, resource = null, resourceId = null, metadata = null) => {
  try {
    await ActivityLog.create({
      user: userId,
      action,
      description,
      resource,
      resourceId,
      metadata
    });
  } catch (error) {
    console.error('Error creating activity log:', error);
  }
};

// Get all activity logs (admin only)
router.get('/', auth, authorize('admin'), async (req, res) => {
  try {
    const { startDate, endDate, action, userId, limit = 50 } = req.query;
    
    const query = {};
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }
    
    if (action) query.action = action;
    if (userId) query.user = userId;

    const logs = await ActivityLog.find(query)
      .populate('user', 'name username role')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    const totalLogs = await ActivityLog.countDocuments(query);

    res.json({
      logs,
      total: totalLogs,
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    res.status(500).json({ error: 'Error fetching activity logs' });
  }
});

// Get activity logs for current user
router.get('/my-activity', auth, async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    const logs = await ActivityLog.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json(logs);
  } catch (error) {
    console.error('Error fetching user activity logs:', error);
    res.status(500).json({ error: 'Error fetching activity logs' });
  }
});

// Get activity statistics
router.get('/stats', auth, authorize('admin'), async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const stats = await ActivityLog.aggregate([
      {
        $match: { createdAt: { $gte: today } }
      },
      {
        $group: {
          _id: '$action',
          count: { $sum: 1 }
        }
      }
    ]);

    const topUsers = await ActivityLog.aggregate([
      {
        $match: { createdAt: { $gte: today } }
      },
      {
        $group: {
          _id: '$user',
          activityCount: { $sum: 1 }
        }
      },
      {
        $sort: { activityCount: -1 }
      },
      {
        $limit: 5
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
        $project: {
          _id: 1,
          activityCount: 1,
          name: '$userInfo.name',
          username: '$userInfo.username'
        }
      }
    ]);

    res.json({
      todayStats: stats,
      topUsers
    });
  } catch (error) {
    console.error('Error fetching activity stats:', error);
    res.status(500).json({ error: 'Error fetching activity statistics' });
  }
});

module.exports = { router, createActivityLog };
