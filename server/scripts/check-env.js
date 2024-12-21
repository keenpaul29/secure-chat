#!/usr/bin/env node

/**
 * Environment validation script
 */

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Helper to print colored messages
const print = {
  info: (msg) => console.log(`${colors.blue}[INFO]${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}[SUCCESS]${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}[WARNING]${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}[ERROR]${colors.reset} ${msg}`),
};

// Required environment variables
const requiredEnvVars = [
  {
    key: 'PORT',
    validate: (value) => {
      const port = parseInt(value);
      return !isNaN(port) && port > 0 && port < 65536;
    },
    message: 'PORT must be a valid port number between 1 and 65535',
  },
  {
    key: 'MONGO_URI',
    validate: (value) => {
      return value.startsWith('mongodb') && value.includes('@');
    },
    message: 'MONGO_URI must be a valid MongoDB connection string',
  },
  {
    key: 'JWT_SECRET',
    validate: (value) => value.length >= 32,
    message: 'JWT_SECRET must be at least 32 characters long',
  },
  {
    key: 'NODE_ENV',
    validate: (value) => ['development', 'production', 'test'].includes(value),
    message: 'NODE_ENV must be one of: development, production, test',
  },
];

// Check if .env file exists
const checkEnvFile = () => {
  const envPath = path.resolve(__dirname, '..', '.env');
  
  if (!fs.existsSync(envPath)) {
    print.error('.env file not found!');
    print.info('Creating example .env file...');
    
    const exampleEnv = `PORT=5001
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/database
JWT_SECRET=your-secret-key-min-32-chars-long
NODE_ENV=development
LOG_LEVEL=debug
SOCKET_PING_TIMEOUT=60000
SOCKET_PING_INTERVAL=25000
MAX_RECONNECTION_ATTEMPTS=5
RECONNECTION_DELAY=1000
`;
    
    fs.writeFileSync(`${envPath}.example`, exampleEnv);
    print.success('Created .env.example file');
    print.info('Please create a .env file with your configuration');
    
    return false;
  }

  return true;
};

// Validate environment variables
const validateEnv = () => {
  let isValid = true;
  const missingVars = [];
  const invalidVars = [];

  requiredEnvVars.forEach(({ key, validate, message }) => {
    const value = process.env[key];
    
    if (!value) {
      missingVars.push(key);
      isValid = false;
    } else if (!validate(value)) {
      invalidVars.push({ key, message });
      isValid = false;
    }
  });

  if (missingVars.length > 0) {
    print.error('Missing required environment variables:');
    missingVars.forEach((key) => print.error(`- ${key}`));
  }

  if (invalidVars.length > 0) {
    print.error('Invalid environment variables:');
    invalidVars.forEach(({ key, message }) => print.error(`- ${key}: ${message}`));
  }

  return isValid;
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
    
    return false;
  }
};

// Check required directories
const checkDirectories = () => {
  const requiredDirs = [
    'config',
    'middleware',
    'models',
    'routes',
    'src',
    'scripts',
  ];

  const missingDirs = [];

  requiredDirs.forEach((dir) => {
    const dirPath = path.resolve(__dirname, '..', dir);
    if (!fs.existsSync(dirPath)) {
      missingDirs.push(dir);
    }
  });

  if (missingDirs.length > 0) {
    print.error('Missing required directories:');
    missingDirs.forEach((dir) => print.error(`- ${dir}`));
    return false;
  }

  return true;
};

// Check required files
const checkFiles = () => {
  const requiredFiles = [
    'server.js',
    'start.js',
    'package.json',
    'nodemon.json',
    '.eslintrc.json',
    '.prettierrc',
  ];

  const missingFiles = [];

  requiredFiles.forEach((file) => {
    const filePath = path.resolve(__dirname, '..', file);
    if (!fs.existsSync(filePath)) {
      missingFiles.push(file);
    }
  });

  if (missingFiles.length > 0) {
    print.error('Missing required files:');
    missingFiles.forEach((file) => print.error(`- ${file}`));
    return false;
  }

  return true;
};

// Main function
const main = async () => {
  print.info('Starting environment check...');
  
  let isValid = true;

  // Check .env file
  if (!checkEnvFile()) {
    isValid = false;
  }

  // Load environment variables
  require('dotenv').config();

  // Validate environment variables
  if (!validateEnv()) {
    isValid = false;
  }

  // Check directories and files
  if (!checkDirectories() || !checkFiles()) {
    isValid = false;
  }

  // Test MongoDB connection
  if (!await testMongoConnection()) {
    isValid = false;
  }

  if (isValid) {
    print.success('Environment check passed!');
    process.exit(0);
  } else {
    print.error('Environment check failed!');
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

// Run script
main();
