const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');
const { createActivityLog } = require('./activityLogs');

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });

    if (!user || !user.active) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Log login activity
    await createActivityLog(
      user._id,
      'login',
      `${user.name} (@${user.username}) logged in as ${user.role}`,
      'User',
      user._id
    );

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        role: user.role,
        email: user.email
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get current user profile
router.get('/me', auth, async (req, res) => {
  try {
    const user = req.user;
    res.json({
      id: user._id,
      username: user.username,
      name: user.name,
      role: user.role,
      email: user.email,
      lastLogin: user.lastLogin
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Logout
router.post('/logout', auth, async (req, res) => {
  try {
    // Log logout activity
    await createActivityLog(
      req.user._id,
      'logout',
      `${req.user.name} (@${req.user.username}) logged out`,
      'User',
      req.user._id
    );

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create new user (admin only)
router.post('/users', auth, authorize('admin'), async (req, res) => {
  try {
    const { username, password, name, email, role } = req.body;

    // Check if username or email already exists
    const existingUser = await User.findOne({
      $or: [{ username }, { email }]
    });

    if (existingUser) {
      return res.status(400).json({
        error: 'Username or email already exists'
      });
    }

    const user = new User({
      username,
      password,
      name,
      email,
      role
    });

    await user.save();

    // Log user creation
    await createActivityLog(
      req.user._id,
      'create_user',
      `Created new ${role} user: ${name} (@${username})`,
      'User',
      user._id
    );

    res.status(201).json({
      id: user._id,
      username: user.username,
      name: user.name,
      role: user.role,
      email: user.email
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update user (admin only, except for own profile)
router.put('/users/:id', auth, async (req, res) => {
  try {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['name', 'email', 'password', 'active'];
    
    // Admin can update roles, regular users cannot
    if (req.user.role === 'admin') {
      allowedUpdates.push('role');
    }

    // Check if updates are valid
    const isValidOperation = updates.every(update => 
      allowedUpdates.includes(update)
    );

    if (!isValidOperation) {
      return res.status(400).json({ error: 'Invalid updates' });
    }

    // Only admin can update other users
    if (req.params.id !== req.user.id.toString() && 
        req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'You can only update your own profile'
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    updates.forEach(update => user[update] = req.body[update]);
    await user.save();

    // Log user update
    await createActivityLog(
      req.user._id,
      'update_user',
      `Updated user: ${user.name} (@${user.username})`,
      'User',
      user._id,
      { updates }
    );

    res.json({
      id: user._id,
      username: user.username,
      name: user.name,
      role: user.role,
      email: user.email,
      active: user.active
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all users (admin only)
router.get('/users', auth, authorize('admin'), async (req, res) => {
  try {
    const users = await User.find({}, '-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;