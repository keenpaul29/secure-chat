const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, publicKey } = req.body;

    // Validate required fields
    if (!username || !email || !password || !publicKey) {
      return res.status(400).json({ 
        message: 'All fields are required',
        details: {
          username: !username ? 'Username is required' : null,
          email: !email ? 'Email is required' : null,
          password: !password ? 'Password is required' : null,
          publicKey: !publicKey ? 'Public key is required' : null
        }
      });
    }

    // Validate password strength
    if (password.length < 8) {
      return res.status(400).json({
        message: 'Password too weak',
        details: 'Password must be at least 8 characters long'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({
        message: 'User already exists',
        details: existingUser.email === email ? 
          'Email already registered' : 
          'Username already taken'
      });
    }

    // Create new user
    const user = new User({
      username,
      email,
      password,
      publicKey,
      active: true,
      lastLogin: new Date(),
      lastActive: new Date()
    });

    await user.save();

    // Generate token
    const token = jwt.sign(
      { 
        userId: user._id,
        username: user.username
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      token,
      userId: user._id,
      username: user.username,
      email: user.email,
      publicKey: user.publicKey
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      message: 'Error creating account',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ 
        message: 'All fields are required',
        details: {
          email: !email ? 'Email is required' : null,
          password: !password ? 'Password is required' : null
        }
      });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ 
        message: 'Authentication failed',
        details: 'Invalid email or password'
      });
    }

    // Check if account is locked
    if (user.isLocked) {
      const lockTime = Math.ceil((user.lockUntil - Date.now()) / 1000 / 60);
      return res.status(423).json({
        message: 'Account temporarily locked',
        details: `Try again in ${lockTime} minutes`
      });
    }

    // Check if account is active
    if (!user.active) {
      return res.status(401).json({
        message: 'Authentication failed',
        details: 'Account is inactive'
      });
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      await user.handleFailedLogin();
      
      if (user.loginAttempts >= 5) {
        return res.status(423).json({
          message: 'Account locked',
          details: 'Too many failed attempts. Try again in 1 hour'
        });
      }

      return res.status(401).json({
        message: 'Authentication failed',
        details: 'Invalid email or password',
        attemptsLeft: 5 - user.loginAttempts
      });
    }

    // Handle successful login
    await user.handleSuccessfulLogin();

    // Generate token
    const token = jwt.sign(
      { 
        userId: user._id,
        username: user.username
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      userId: user._id,
      username: user.username,
      email: user.email,
      publicKey: user.publicKey
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      message: 'Login error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .select('-password -loginAttempts -lockUntil');
    
    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    await user.updateActivity();
    res.json(user);

  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ 
      message: 'Error fetching user data',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Update user
router.patch('/me', auth, async (req, res) => {
  try {
    const updates = {};
    const allowedUpdates = ['username', 'email', 'publicKey'];
    
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        message: 'No valid updates provided',
        details: `Allowed updates: ${allowedUpdates.join(', ')}`
      });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    // Check for unique constraints
    if (updates.username || updates.email) {
      const existing = await User.findOne({
        _id: { $ne: req.userId },
        $or: [
          updates.username ? { username: updates.username } : null,
          updates.email ? { email: updates.email } : null
        ].filter(Boolean)
      });

      if (existing) {
        return res.status(400).json({
          message: 'Update failed',
          details: existing.username === updates.username ? 
            'Username already taken' : 
            'Email already registered'
        });
      }
    }

    // Apply updates
    Object.assign(user, updates);
    await user.save();

    res.json(user);

  } catch (error) {
    console.error('Update error:', error);
    res.status(500).json({ 
      message: 'Error updating user',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
