const express = require('express');
const router = express.Router();
const Room = require('../models/Room');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Middleware to verify token
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization').replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ message: 'Please authenticate' });
  }
};

// Create a new room
router.post('/', auth, async (req, res) => {
  try {
    console.log('Creating room with data:', req.body);
    const { name, participants = [] } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ message: 'Room name is required' });
    }

    // Check if room name already exists
    const existingRoom = await Room.findOne({ name: name.trim() });
    if (existingRoom) {
      return res.status(400).json({ message: 'Room name already exists' });
    }

    // Create new room with creator as initial participant
    const room = new Room({
      name: name.trim(),
      creator: req.userId,
      participants: [req.userId, ...participants.filter(id => id !== req.userId)],
      isPrivate: true
    });

    await room.save();
    console.log('Room created:', room);

    // Populate participant details
    const populatedRoom = await Room.findById(room._id)
      .populate('participants', 'username email')
      .populate('creator', 'username email');

    res.status(201).json(populatedRoom);
  } catch (error) {
    console.error('Server error creating room:', error);
    res.status(500).json({ 
      message: 'Error creating room', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get all rooms for a user
router.get('/', auth, async (req, res) => {
  try {
    const rooms = await Room.find({
      participants: req.userId
    })
    .populate('participants', 'username email')
    .populate('creator', 'username email')
    .sort({ createdAt: -1 });

    res.json(rooms);
  } catch (error) {
    console.error('Error fetching rooms:', error);
    res.status(500).json({ message: 'Error fetching rooms' });
  }
});

// Get specific room
router.get('/:id', auth, async (req, res) => {
  try {
    const room = await Room.findOne({
      _id: req.params.id,
      participants: req.userId
    })
    .populate('participants', 'username email')
    .populate('creator', 'username email');

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    res.json(room);
  } catch (error) {
    console.error('Error fetching room:', error);
    res.status(500).json({ message: 'Error fetching room' });
  }
});

// Add participants to room
router.post('/:id/participants', auth, async (req, res) => {
  try {
    const { participants } = req.body;
    const room = await Room.findOne({
      _id: req.params.id,
      creator: req.userId
    });

    if (!room) {
      return res.status(404).json({ message: 'Room not found or unauthorized' });
    }

    // Add new participants
    const newParticipants = participants.filter(
      id => !room.participants.includes(id)
    );
    room.participants.push(...newParticipants);

    await room.save();

    const updatedRoom = await Room.findById(room._id)
      .populate('participants', 'username email')
      .populate('creator', 'username email');

    res.json(updatedRoom);
  } catch (error) {
    console.error('Error adding participants:', error);
    res.status(500).json({ message: 'Error adding participants' });
  }
});

// Leave room
router.delete('/:id/leave', auth, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // If user is creator and there are other participants, assign new creator
    if (room.creator.toString() === req.userId && room.participants.length > 1) {
      const newCreator = room.participants.find(p => p.toString() !== req.userId);
      room.creator = newCreator;
    }
    
    // Remove user from participants
    room.participants = room.participants.filter(
      p => p.toString() !== req.userId
    );

    // If no participants left, delete the room
    if (room.participants.length === 0) {
      await Room.deleteOne({ _id: room._id });
      return res.json({ message: 'Room deleted' });
    }

    await room.save();
    res.json({ message: 'Left room successfully' });
  } catch (error) {
    console.error('Error leaving room:', error);
    res.status(500).json({ message: 'Error leaving room' });
  }
});

module.exports = router;
