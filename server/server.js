const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
dotenv.config();

// Initialize express app
const app = express();
const server = http.createServer(app);

// Load environment-specific configuration
const config = require(`./config/${process.env.NODE_ENV || 'development'}.js`);

// Initialize Socket.IO with enhanced configuration
const io = socketIo(server, {
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
  },
  allowEIO3: true,
  pingTimeout: parseInt(process.env.SOCKET_PING_TIMEOUT) || 60000,
  pingInterval: parseInt(process.env.SOCKET_PING_INTERVAL) || 25000,
  upgradeTimeout: 30000,
  maxHttpBufferSize: 1e8,
  transports: ['websocket', 'polling'],
  allowUpgrades: true
});

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// Logging
morgan.token('user', (req) => req.user?.username || 'anonymous');
morgan.token('body', (req) => JSON.stringify(req.body));
app.use(morgan(':method :url :status :response-time ms - :user :body'));

// CORS
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'If-None-Match', 'If-Modified-Since'],
  exposedHeaders: ['ETag', 'Last-Modified']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later'
});
app.use('/api/', limiter);

// Compression
app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  level: 6 // Default compression level
}));

// Body parsing
app.use(express.json({
  limit: '1mb',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));

// Cache control middleware
app.use((req, res, next) => {
  // Cache static assets
  if (req.method === 'GET' && req.path.startsWith('/static/')) {
    res.set('Cache-Control', 'public, max-age=31536000'); // 1 year
    return next();
  }

  // Cache API responses
  if (req.method === 'GET' && req.path.startsWith('/api/')) {
    res.set('Cache-Control', 'private, must-revalidate');
  } else {
    // Prevent caching for non-GET requests
    res.set('Cache-Control', 'no-store');
  }
  next();
});

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.baseUrl}${req.path}`);
  next();
});

// MongoDB Connection with better error handling
let dbConnection;
const connectDB = async () => {
  try {
    if (dbConnection) {
      console.log('Using existing MongoDB connection');
      return dbConnection;
    }

    console.log('Connecting to MongoDB...');
    dbConnection = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log('Connected to MongoDB');

    // Initialize models and indexes after connection
    const User = require('./models/User');
    const Room = require('./models/Room');
    const Message = require('./src/models/Message');

    // Initialize indexes sequentially
    try {
      await User.init();
      console.log('User model initialized');
      
      await Room.init();
      console.log('Room model initialized');
      
      await Message.init();
      console.log('Message model initialized');

      console.log('All models initialized successfully');
    } catch (error) {
      console.error('Error initializing models:', error);
      throw error;
    }

    return dbConnection;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
};

// Connect to MongoDB before starting server
connectDB().then(() => {
  // Routes
  const authRoutes = require('./routes/auth');
  const roomRoutes = require('./routes/rooms');
  const userRoutes = require('./routes/users');
  const messageRoutes = require('./src/routes/messages');

  // Register routes
  app.use('/api/auth', authRoutes);
  app.use('/api/rooms', roomRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/messages', messageRoutes);

  // Health check endpoint
  app.get('/', (req, res) => {
    res.json({ 
      status: "API Working",
      timestamp: new Date(),
      env: process.env.NODE_ENV || 'development',
      socketTransports: io.engine?.transports || ['websocket', 'polling']
    });
  });

  // CORS preflight
  app.options('*', cors());

  // 404 handler
  app.use((req, res) => {
    console.log('404 - Route not found:', req.url);
    res.status(404).json({ 
      message: 'Route not found',
      path: req.url
    });
  });

  // Error handling middleware
  app.use((err, req, res, next) => {
    console.error('Error occurred:', {
      message: err.message,
      stack: err.stack,
      path: req.url,
      method: req.method
    });
    
    res.status(err.status || 500).json({
      message: err.message || 'Something went wrong!',
      error: process.env.NODE_ENV === 'development' ? {
        message: err.message,
        stack: err.stack
      } : undefined
    });
  });

  // Initialize socket.io with our enhanced implementation
  require('./src/socket')(io);

  const PORT = process.env.PORT || 5001;

  // Start server with error handling
  server.listen(PORT, () => {
    console.log('=================================');
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`MongoDB: ${process.env.MONGO_URI.split('@')[1]}`);
    console.log(`Socket.IO transports: ${io.engine?.transports?.join(', ') || 'websocket, polling'}`);
    console.log('=================================');
  }).on('error', (err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}).catch(error => {
  console.error('Failed to initialize server:', error);
  process.exit(1);
});

// Handle server shutdown gracefully
const shutdown = async () => {
  console.log('\nShutdown signal received...');
  
  try {
    // Close socket connections first
    if (io) {
      await new Promise((resolve) => {
        io.close(() => {
          console.log('Socket.IO server closed');
          resolve();
        });
      });
    }

    // Then close HTTP server
    if (server) {
      await new Promise((resolve) => {
        server.close(() => {
          console.log('HTTP server closed');
          resolve();
        });
      });
    }

    // Finally close MongoDB connection
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('MongoDB connection closed');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
};

// Handle various shutdown signals
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  shutdown();
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Cleanup on exit
process.on('exit', (code) => {
  console.log(`Process exiting with code: ${code}`);
});
