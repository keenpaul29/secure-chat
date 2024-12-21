const express = require('express');
const router = express.Router();
const Room = require('../models/Room');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Create a new room
router.post('/', auth, async (req, res) => {
  try {
    console.log('Creating room with data:', req.body);
    const { name, participants = [], isPrivate = true } = req.body;

    if (!name || name.trim().length < 2 || name.trim().length > 50) {
      return res.status(400).json({ 
        message: 'Room name must be between 2 and 50 characters' 
      });
    }

    // Check if room name already exists (case-insensitive)
    const existingRoom = await Room.findOne({ 
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') }
    });
    if (existingRoom) {
      return res.status(400).json({ message: 'Room name already exists' });
    }

    // Validate participants exist
    if (participants.length > 0) {
      const validUsers = await User.find({ _id: { $in: participants } });
      if (validUsers.length !== participants.length) {
        return res.status(400).json({ message: 'One or more invalid participants' });
      }
    }

    // Create new room (creator is automatically added as participant)
    const room = new Room({
      name: name.trim(),
      creator: req.userId,
      participants: participants.filter(id => id !== req.userId),
      isPrivate
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
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get all rooms for a user
router.get('/', auth, async (req, res) => {
  try {
    const rooms = await Room.find({
      $or: [
        { participants: req.userId },
        { isPrivate: false }
      ]
    })
    .populate('participants', 'username email')
    .populate('creator', 'username email')
    .sort({ lastActivity: -1 });

    res.json(rooms);
  } catch (error) {
    console.error('Error fetching rooms:', error);
    res.status(500).json({ message: 'Error fetching rooms' });
  }
});

// Get specific room
router.get('/:id', auth, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id)
      .populate('participants', 'username email')
      .populate('creator', 'username email');

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    if (!room.hasAccess(req.userId)) {
      return res.status(403).json({ message: 'Access denied to room' });
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
    
    if (!Array.isArray(participants) || participants.length === 0) {
      return res.status(400).json({ message: 'No participants provided' });
    }

    const room = await Room.findOne({
      _id: req.params.id,
      creator: req.userId
    });

    if (!room) {
      return res.status(404).json({ message: 'Room not found or unauthorized' });
    }

    // Validate participants exist
    const validUsers = await User.find({ _id: { $in: participants } });
    if (validUsers.length !== participants.length) {
      return res.status(400).json({ message: 'One or more invalid participants' });
    }

    // Add new participants using the model method
    await room.addParticipants(participants);

    const updatedRoom = await Room.findById(room._id)
      .populate('participants', 'username email')
      .populate('creator', 'username email');

    res.json(updatedRoom);
  } catch (error) {
    console.error('Error adding participants:', error);
    res.status(500).json({ 
      message: 'Error adding participants',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Remove participant from room
router.delete('/:id/participants/:userId', auth, async (req, res) => {
  try {
    const room = await Room.findOne({
      _id: req.params.id,
      creator: req.userId
    });

    if (!room) {
      return res.status(404).json({ message: 'Room not found or unauthorized' });
    }

    // Remove participant using the model method
    await room.removeParticipant(req.params.userId);

    const updatedRoom = await Room.findById(room._id)
      .populate('participants', 'username email')
      .populate('creator', 'username email');

    res.json(updatedRoom);
  } catch (error) {
    console.error('Error removing participant:', error);
    res.status(500).json({ 
      message: 'Error removing participant',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Leave room
router.delete('/:id/leave', auth, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    if (!room.hasAccess(req.userId)) {
      return res.status(403).json({ message: 'Not a member of this room' });
    }

    // If user is creator and there are other participants, assign new creator
    if (room.creator.equals(req.userId) && room.participants.length > 1) {
      const newCreator = room.participants.find(p => !p.equals(req.userId));
      room.creator = newCreator;
    }
    
    // Remove user from participants
    room.participants = room.participants.filter(p => !p.equals(req.userId));

    // If no participants left, delete the room
    if (room.participants.length === 0) {
      await Room.deleteOne({ _id: room._id });
      return res.json({ message: 'Room deleted' });
    }

    await room.save();
    res.json({ message: 'Left room successfully' });
  } catch (error) {
    console.error('Error leaving room:', error);
    res.status(500).json({ 
      message: 'Error leaving room',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
