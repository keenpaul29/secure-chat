const jwt = require('jsonwebtoken');
const Message = require('./models/Message');
const config = require('./config');

module.exports = (io) => {
  // Middleware to authenticate socket connections
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error'));
    }

    try {
      const decoded = jwt.verify(token, config.JWT_SECRET);
      socket.userId = decoded.userId;
      socket.username = decoded.username;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log('User connected:', socket.username);

    // Join global chat by default
    socket.join('global');
    socket.emit('roomJoined', 'global');

    socket.on('joinGlobalChat', () => {
      socket.join('global');
      socket.emit('roomJoined', 'global');
    });

    socket.on('joinRoom', (roomId) => {
      if (roomId !== 'global') {
        socket.join(roomId);
        socket.to(roomId).emit('userJoined', {
          username: socket.username,
          roomId
        });
        socket.emit('roomJoined', roomId);
      }
    });

    socket.on('sendMessage', async (data) => {
      try {
        // Save message to database
        const message = new Message({
          content: data.content,
          sender: data.sender,
          roomId: data.roomId,
          timestamp: data.timestamp || new Date()
        });
        await message.save();

        // Broadcast message to room
        io.to(data.roomId).emit('message', {
          ...data,
          _id: message._id
        });
      } catch (error) {
        console.error('Error saving message:', error);
        socket.emit('error', { message: 'Error saving message' });
      }
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.username);
    });
  });
};
