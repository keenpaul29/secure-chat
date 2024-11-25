const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const auth = require('../middleware/auth');

// Get messages for a specific room
router.get('/:roomId', auth, async (req, res) => {
  try {
    const { roomId } = req.params;
    
    // Handle global chat messages
    if (roomId === 'global') {
      const messages = await Message.find({ roomId: 'global' })
        .sort({ timestamp: 1 })
        .limit(100);
      return res.json(messages);
    }

    // Handle regular room messages
    const messages = await Message.find({ roomId })
      .sort({ timestamp: 1 })
      .limit(100);
    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Error fetching messages' });
  }
});

module.exports = router;
