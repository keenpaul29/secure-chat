const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const Room = require('./models/Room'); // Assuming Room model is defined in ./models/Room.js

dotenv.config();

const app = express();
if (process.env.NODE_ENV === 'production') {
    console.log("API Working");
}
const server = http.createServer(app);

// Load environment-specific configuration
const config = require(`./config/${process.env.NODE_ENV || 'development'}.js`);

const io = socketIo(server, {
  cors: config.cors
});

// Middleware
app.use(cors(config.cors));
app.use(express.json());

// MongoDB Connection with better error handling
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
})
.then(() => {
  console.log('Connected to MongoDB');
})
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// Routes
const authRoutes = require('./routes/auth');
const roomRoutes = require('./routes/rooms');
const userRoutes = require('./routes/users');
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/users', userRoutes);

// Socket.IO middleware for authentication
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  
  if (!token) {
    return next(new Error('Authentication error'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.userId;
    next();
  } catch (err) {
    next(new Error('Authentication error'));
  }
});

// Socket.IO Connection
io.on('connection', (socket) => {
  console.log('New client connected:', socket.userId);

  // Join the global room by default
  socket.join('global');

  // Handle joining private rooms
  socket.on('joinRoom', async (roomId) => {
    try {
      console.log('Attempting to join room:', roomId);
      const room = await Room.findById(roomId)
        .populate('participants', 'username');

      if (room && room.participants.some(p => p._id.toString() === socket.userId)) {
        socket.join(roomId);
        socket.emit('roomJoined', roomId);
        console.log('User joined room:', roomId);
        
        // Notify other participants
        socket.to(roomId).emit('userJoined', {
          roomId,
          username: room.participants.find(p => p._id.toString() === socket.userId).username
        });
      } else {
        console.log('Room not found or user not authorized:', roomId);
      }
    } catch (error) {
      console.error('Error joining room:', error);
    }
  });

  // Handle leaving rooms
  socket.on('leaveRoom', async (roomId) => {
    try {
      socket.leave(roomId);
      socket.emit('roomLeft', roomId);
      console.log('User left room:', roomId);
    } catch (error) {
      console.error('Error leaving room:', error);
    }
  });

  socket.on('sendMessage', async (data) => {
    try {
      console.log('Message received for room:', data.room);
      // Broadcast the message to the specific room
      io.to(data.room).emit('message', {
        content: data.content,
        sender: data.sender,
        roomId: data.room,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error sending message:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.userId);
  });
});

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
