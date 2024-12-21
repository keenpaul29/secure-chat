#!/usr/bin/env node

/**
 * Server startup script with enhanced error handling and initialization
 */

const path = require('path');
const dotenv = require('dotenv');
const fs = require('fs');
const mongoose = require('mongoose');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

// Helper to print colored messages
const print = {
  info: (msg) => console.log(`${colors.blue}[INFO]${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}[SUCCESS]${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}[WARNING]${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}[ERROR]${colors.reset} ${msg}`),
};

// Load and validate environment variables
const loadEnv = () => {
  const envPath = path.resolve(__dirname, '.env');
  
  if (!fs.existsSync(envPath)) {
    print.error('.env file not found!');
    process.exit(1);
  }

  dotenv.config({ path: envPath });

  const requiredEnvVars = ['PORT', 'MONGO_URI', 'JWT_SECRET', 'NODE_ENV'];
  const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

  if (missingEnvVars.length > 0) {
    print.error('Missing required environment variables:');
    missingEnvVars.forEach(envVar => print.error(`- ${envVar}`));
    process.exit(1);
  }
};

// Test MongoDB connection
const testMongoConnection = async () => {
  try {
    print.info('Testing MongoDB connection...');
    
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
    });
    
    print.success('MongoDB connection successful');
    await mongoose.disconnect();
    
    return true;
  } catch (error) {
    print.error('MongoDB connection failed:');
    print.error(error.message);
    process.exit(1);
  }
};

// Check required directories and files
const checkFiles = () => {
  const requiredDirs = [
    'config',
    'middleware',
    'models',
    'routes',
    'src',
    'scripts',
  ];

  const requiredFiles = [
    'server.js',
    'package.json',
    'nodemon.json',
    '.eslintrc.json',
    '.prettierrc',
  ];

  let isValid = true;

  // Check directories
  requiredDirs.forEach((dir) => {
    const dirPath = path.resolve(__dirname, dir);
    if (!fs.existsSync(dirPath)) {
      print.error(`Missing required directory: ${dir}`);
      isValid = false;
    }
  });

  // Check files
  requiredFiles.forEach((file) => {
    const filePath = path.resolve(__dirname, file);
    if (!fs.existsSync(filePath)) {
      print.error(`Missing required file: ${file}`);
      isValid = false;
    }
  });

  if (!isValid) {
    process.exit(1);
  }
};

// Initialize models
const initializeModels = async () => {
  try {
    print.info('Initializing models...');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
    });

    // Load models
    const User = require('./models/User');
    const Room = require('./models/Room');
    const Message = require('./src/models/Message');

    // Initialize models sequentially
    await User.init();
    print.success('User model initialized');
    
    await Room.init();
    print.success('Room model initialized');
    
    await Message.init();
    print.success('Message model initialized');

    // Disconnect after initialization
    await mongoose.disconnect();
    print.success('All models initialized successfully');
  } catch (error) {
    print.error('Error initializing models:');
    print.error(error.message);
    process.exit(1);
  }
};

// Main function
const main = async () => {
  try {
    print.info('Starting server initialization...');

    // Load environment variables
    loadEnv();
    print.success('Environment variables loaded');

    // Check files and directories
    checkFiles();
    print.success('File structure verified');

    // Test MongoDB connection
    await testMongoConnection();
    print.success('MongoDB connection verified');

    // Initialize models
    await initializeModels();
    print.success('Models initialized');

    // Start server
    print.info('Starting server...');
    require('./server');
  } catch (error) {
    print.error('Server initialization failed:');
    print.error(error.message);
    process.exit(1);
  }
};

// Handle errors
process.on('uncaughtException', (error) => {
  print.error(`Uncaught Exception: ${error.message}`);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  print.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('SIGTERM', () => {
  print.info('Received SIGTERM signal');
  process.exit(0);
});

process.on('SIGINT', () => {
  print.info('Received SIGINT signal');
  process.exit(0);
});

// Run script
main();
