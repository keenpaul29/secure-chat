const express = require('express');
const router = express.Router();
const Message = require('../models/Message.js');
const Room = require('../../models/Room.js');
const auth = require('../../middleware/auth');
const crypto = require('crypto');

// Helper to generate ETag
const generateETag = (data) => {
  return crypto
    .createHash('md5')
    .update(JSON.stringify(data))
    .digest('hex');
};

// Helper to format messages
const formatMessages = (messages) => {
  return messages.map(msg => ({
    _id: msg._id.toString(),
    content: msg.content,
    sender: msg.sender,
    roomId: msg.roomId,
    timestamp: msg.timestamp,
    type: msg.type || 'text',
    metadata: {
      encrypted: msg.metadata?.encrypted || false,
      edited: msg.metadata?.edited || false,
      editedAt: msg.metadata?.editedAt,
      delivered: true
    }
  }));
};

// Get messages for a specific room or global chat
router.get('/:roomId', auth, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { before, after, limit = '100' } = req.query;
    
    console.log('Fetching messages:', {
      roomId,
      user: req.username,
      before,
      after,
      limit
    });

    // Validate limit
    const messageLimit = Math.min(Math.max(parseInt(limit) || 100, 1), 100);

    // Build query
    const query = { roomId };
    if (before || after) {
      query.timestamp = {};
      if (before) query.timestamp.$lt = new Date(before);
      if (after) query.timestamp.$gt = new Date(after);
    }
    
    // Handle global chat messages
    if (roomId === 'global') {
      console.log('Fetching global chat messages');
      
      const messages = await Message.find(query)
        .sort({ timestamp: after ? 1 : -1 })
        .limit(messageLimit)
        .lean()
        .exec();
      
      console.log('Found global messages:', messages.length);
      
      // Format messages
      const formattedMessages = formatMessages(messages);
      
      // Sort messages chronologically if fetching newer messages
      if (after) {
        formattedMessages.sort((a, b) => 
          new Date(a.timestamp) - new Date(b.timestamp)
        );
      }

      // Generate ETag
      const etag = generateETag(formattedMessages);

      // Check If-None-Match header
      if (req.headers['if-none-match'] === etag) {
        return res.status(304).end();
      }

      // Set caching headers
      res.set({
        'ETag': etag,
        'Cache-Control': 'private, must-revalidate',
        'Last-Modified': new Date().toUTCString()
      });
      
      console.log('Sending formatted global messages');
      return res.json({
        messages: formattedMessages,
        metadata: {
          count: formattedMessages.length,
          hasMore: formattedMessages.length === messageLimit,
          roomType: 'global'
        }
      });
    }

    // Verify user has access to the room
    const room = await Room.findOne({
      _id: roomId,
      participants: req.userId
    });
    
    if (!room) {
      console.log('Access denied to room:', roomId, 'for user:', req.username);
      return res.status(403).json({ 
        message: 'Access denied to room',
        details: 'You are not a participant of this room'
      });
    }
    console.log('Access granted to room:', roomId, 'for user:', req.username);

    // Update user's last activity in room
    await room.updateActivity();

    // Handle regular room messages
    const messages = await Message.find(query)
      .sort({ timestamp: after ? 1 : -1 })
      .limit(messageLimit)
      .lean()
      .exec();
    
    console.log('Found room messages:', messages.length);
    
    // Format messages
    const formattedMessages = formatMessages(messages);
    
    // Sort messages chronologically if fetching newer messages
    if (after) {
      formattedMessages.sort((a, b) => 
        new Date(a.timestamp) - new Date(b.timestamp)
      );
    }

    // Generate ETag
    const etag = generateETag(formattedMessages);

    // Check If-None-Match header
    if (req.headers['if-none-match'] === etag) {
      return res.status(304).end();
    }

    // Set caching headers
    res.set({
      'ETag': etag,
      'Cache-Control': 'private, must-revalidate',
      'Last-Modified': new Date().toUTCString()
    });
    
    console.log('Sending formatted room messages');
    res.json({
      messages: formattedMessages,
      metadata: {
        count: formattedMessages.length,
        hasMore: formattedMessages.length === messageLimit,
        roomType: 'private',
        room: {
          id: room._id,
          name: room.name,
          isPrivate: room.isPrivate,
          participantCount: room.participants.length,
          lastActivity: room.lastActivity
        }
      }
    });
  } catch (error) {
    console.error('Error fetching messages:', {
      error: error.message,
      stack: error.stack,
      roomId: req.params.roomId,
      user: req.username
    });

    // Handle specific error cases
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        message: 'Invalid room ID format',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }

    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Invalid request parameters',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }

    res.status(500).json({ 
      message: 'Error fetching messages',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
