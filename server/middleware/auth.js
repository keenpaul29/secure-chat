const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    // Extract token from Authorization header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ 
        message: 'Authentication required',
        details: 'No auth token provided'
      });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          message: 'Authentication expired',
          details: 'Token has expired'
        });
      }
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          message: 'Invalid authentication',
          details: 'Token is malformed'
        });
      }
      throw error;
    }

    // Validate token payload
    if (!decoded.userId || !decoded.username) {
      return res.status(401).json({
        message: 'Invalid authentication',
        details: 'Token payload is invalid'
      });
    }

    // Verify user still exists
    const user = await User.findById(decoded.userId).select('username active');
    if (!user) {
      return res.status(401).json({
        message: 'Authentication failed',
        details: 'User no longer exists'
      });
    }

    if (!user.active) {
      return res.status(401).json({
        message: 'Authentication failed',
        details: 'User account is inactive'
      });
    }

    // Add user info to request
    req.userId = decoded.userId;
    req.username = user.username; // Use current username from DB
    req.user = user; // Add full user object for convenience

    // Log authentication success
    console.log('Auth successful:', {
      userId: req.userId,
      username: req.username,
      path: req.path,
      method: req.method,
      timestamp: new Date().toISOString()
    });

    next();
  } catch (error) {
    console.error('Auth middleware error:', {
      error: error.message,
      stack: error.stack,
      path: req.path,
      method: req.method,
      timestamp: new Date().toISOString()
    });

    res.status(500).json({ 
      message: 'Authentication error',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

module.exports = auth;
