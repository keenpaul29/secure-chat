const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');

// Search users
router.get('/search', auth, async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || query.trim().length < 2) {
      return res.status(400).json({ 
        message: 'Invalid search query',
        details: 'Search query must be at least 2 characters long'
      });
    }

    // Use the static searchUsers method from User model
    const users = await User.searchUsers(query.trim(), req.userId);
    
    res.json({
      query: query.trim(),
      results: users,
      count: users.length
    });
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ 
      message: 'Error searching users',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get user profile
router.get('/:userId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select('username email publicKey active lastActive');

    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    if (!user.active) {
      return res.status(404).json({
        message: 'User not found',
        details: 'This account is no longer active'
      });
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ 
      message: 'Error fetching user profile',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get multiple users by IDs (for room participants)
router.post('/batch', auth, async (req, res) => {
  try {
    const { userIds } = req.body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        message: 'Invalid request',
        details: 'User IDs array is required'
      });
    }

    if (userIds.length > 100) {
      return res.status(400).json({
        message: 'Too many users requested',
        details: 'Maximum of 100 users can be fetched at once'
      });
    }

    const users = await User.find({
      _id: { $in: userIds },
      active: true
    })
    .select('username email publicKey lastActive')
    .lean();

    // Map results to maintain order and handle missing users
    const results = userIds.map(id => {
      const user = users.find(u => u._id.toString() === id.toString());
      return user || { id, error: 'User not found' };
    });

    res.json({
      users: results,
      count: users.length
    });
  } catch (error) {
    console.error('Error fetching users batch:', error);
    res.status(500).json({ 
      message: 'Error fetching users',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Check username availability
router.get('/check-username/:username', auth, async (req, res) => {
  try {
    const { username } = req.params;

    if (!username || username.length < 3 || username.length > 30) {
      return res.status(400).json({
        message: 'Invalid username',
        details: 'Username must be between 3 and 30 characters'
      });
    }

    const existingUser = await User.findOne({
      _id: { $ne: req.userId },
      username: new RegExp(`^${username}$`, 'i')
    });

    res.json({
      username,
      available: !existingUser,
      suggestion: existingUser ? `${username}${Math.floor(Math.random() * 1000)}` : null
    });
  } catch (error) {
    console.error('Error checking username:', error);
    res.status(500).json({ 
      message: 'Error checking username',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
