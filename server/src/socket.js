require('dotenv').config();
const jwt = require('jsonwebtoken');
const Message = require('./models/Message.js');
const Room = require('../models/Room.js');

module.exports = (io) => {
  // Configure socket.io
  io.configure = {
    pingTimeout: 60000,
    pingInterval: 25000,
    upgradeTimeout: 30000,
    maxHttpBufferSize: 1e8,
    transports: ['websocket', 'polling'],
    allowUpgrades: true,
    cors: {
      origin: ['http://localhost:3000', 'http://localhost:3001'],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      credentials: true,
      allowedHeaders: ['Content-Type', 'Authorization']
    }
  };

  // Middleware to authenticate socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        console.log('No token provided in socket connection');
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      socket.username = decoded.username;
      console.log('Socket authenticated:', { 
        userId: socket.userId, 
        username: socket.username,
        transport: socket.conn.transport.name
      });
      next();
    } catch (err) {
      console.error('Socket auth error:', err);
      next(new Error('Authentication error'));
    }
  });

  const connectedUsers = new Map(); // Track connected users
  const userSockets = new Map(); // Track user's active sockets

  io.on('connection', (socket) => {
    console.log('User connected:', { 
      userId: socket.userId, 
      username: socket.username,
      transport: socket.conn.transport.name,
      address: socket.handshake.address
    });

    // Store user's socket
    if (!userSockets.has(socket.userId)) {
      userSockets.set(socket.userId, new Set());
    }
    userSockets.get(socket.userId).add(socket.id);
    connectedUsers.set(socket.userId, socket.username);

    // Emit connection status
    socket.emit('connect_status', { 
      status: 'connected',
      transport: socket.conn.transport.name
    });

    // Join global chat by default
    socket.join('global');
    socket.emit('roomJoined', 'global');
    console.log('User joined global chat:', socket.username);

    // Handle transport upgrade
    socket.conn.on('upgrade', (transport) => {
      console.log('Socket transport upgraded:', {
        from: socket.conn.transport.name,
        to: transport.name,
        userId: socket.userId
      });
    });

    socket.on('joinGlobalChat', () => {
      socket.join('global');
      socket.emit('roomJoined', 'global');
      console.log('User rejoined global chat:', socket.username);
    });

    socket.on('joinRoom', async (roomId) => {
      try {
        console.log('Join room request:', { roomId, username: socket.username });

        if (roomId === 'global') {
          socket.join('global');
          socket.emit('roomJoined', 'global');
          return;
        }

        // Verify user has access to the room
        const room = await Room.findOne({
          _id: roomId,
          participants: socket.userId
        });

        if (!room) {
          console.log('Room access denied:', { roomId, username: socket.username });
          socket.emit('error', { message: 'Access denied to room' });
          return;
        }

        // Leave previous rooms except global
        const rooms = [...socket.rooms];
        rooms.forEach(room => {
          if (room !== socket.id && room !== 'global') {
            socket.leave(room);
          }
        });

        socket.join(roomId);
        socket.to(roomId).emit('userJoined', {
          username: socket.username,
          roomId
        });
        socket.emit('roomJoined', roomId);
        console.log('User joined room:', { roomId, username: socket.username });
      } catch (error) {
        console.error('Error joining room:', error);
        socket.emit('error', { message: 'Error joining room' });
      }
    });

    socket.on('sendMessage', async (data) => {
      try {
        if (!data.content || !data.sender || !data.roomId) {
          console.log('Invalid message data:', data);
          socket.emit('error', { message: 'Invalid message data' });
          return;
        }

        console.log('Message received:', {
          sender: data.sender,
          roomId: data.roomId,
          timestamp: data.timestamp
        });

        // For global chat
        if (data.roomId === 'global') {
          console.log('Processing global message');
          const message = new Message({
            content: data.content,
            sender: data.sender,
            roomId: 'global',
            timestamp: data.timestamp || new Date(),
            metadata: data.metadata
          });

          const savedMessage = await message.save();
          console.log('Global message saved:', {
            id: savedMessage._id,
            sender: savedMessage.sender,
            timestamp: savedMessage.timestamp
          });

          const messageToSend = {
            _id: savedMessage._id.toString(),
            content: data.content,
            sender: data.sender,
            roomId: 'global',
            timestamp: savedMessage.timestamp,
            metadata: data.metadata
          };

          console.log('Broadcasting global message');
          io.to('global').emit('message', messageToSend);
          return;
        }

        // For private rooms
        const room = await Room.findOne({
          _id: data.roomId,
          participants: socket.userId
        });

        if (!room) {
          console.log('Room access denied for message:', { roomId: data.roomId, username: socket.username });
          socket.emit('error', { message: 'Access denied to room' });
          return;
        }

        console.log('Processing room message');
        const message = new Message({
          content: data.content,
          sender: data.sender,
          roomId: data.roomId,
          timestamp: data.timestamp || new Date(),
          metadata: data.metadata
        });

        const savedMessage = await message.save();
        console.log('Room message saved:', {
          id: savedMessage._id,
          sender: savedMessage.sender,
          roomId: savedMessage.roomId,
          timestamp: savedMessage.timestamp
        });

        const messageToSend = {
          _id: savedMessage._id.toString(),
          content: data.content,
          sender: data.sender,
          roomId: data.roomId,
          timestamp: savedMessage.timestamp,
          metadata: data.metadata
        };

        console.log('Broadcasting room message');
        io.to(data.roomId).emit('message', messageToSend);

        // Send delivery confirmation to sender
        socket.emit('messageDelivered', {
          messageId: savedMessage._id.toString(),
          roomId: data.roomId,
          timestamp: new Date()
        });
      } catch (error) {
        console.error('Error processing message:', error);
        socket.emit('error', { message: 'Error processing message' });
      }
    });

    socket.on('disconnect', (reason) => {
      console.log('User disconnected:', { 
        userId: socket.userId, 
        username: socket.username,
        reason,
        transport: socket.conn.transport.name
      });

      // Remove socket from user's active sockets
      const userSocketSet = userSockets.get(socket.userId);
      if (userSocketSet) {
        userSocketSet.delete(socket.id);
        if (userSocketSet.size === 0) {
          userSockets.delete(socket.userId);
          connectedUsers.delete(socket.userId);
        }
      }

      // Notify rooms about user leaving
      socket.rooms.forEach(roomId => {
        if (roomId !== socket.id) {
          socket.to(roomId).emit('userLeft', {
            username: socket.username,
            roomId
          });
        }
      });
    });

    socket.on('error', (error) => {
      console.error('Socket error:', { 
        error, 
        userId: socket.userId, 
        username: socket.username,
        transport: socket.conn.transport.name
      });
    });
  });

  // Handle server-side socket errors
  io.on('error', (error) => {
    console.error('Socket.IO error:', error);
  });

  // Periodic cleanup of disconnected sockets
  setInterval(() => {
    io.sockets.sockets.forEach(socket => {
      if (!socket.connected) {
        console.log('Cleaning up disconnected socket:', { 
          userId: socket.userId, 
          username: socket.username,
          transport: socket.conn?.transport?.name
        });
        socket.disconnect(true);
      }
    });
  }, 30000);

  // Periodic ping to keep connections alive
  setInterval(() => {
    const sockets = io.sockets.sockets;
    sockets.forEach(socket => {
      if (socket.connected) {
        socket.emit('ping');
      }
    });
  }, 25000);

  return io;
};
