#!/usr/bin/env node

/**
 * Server cleanup script
 */

const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

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

// Load environment variables
const loadEnv = () => {
  const envPath = path.resolve(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }
};

// Clean up MongoDB connections
const cleanupMongo = async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      print.info('Closing MongoDB connection...');
      await mongoose.connection.close();
      print.success('MongoDB connection closed');
    }
  } catch (error) {
    print.error('Error closing MongoDB connection:');
    print.error(error.message);
  }
};

// Clean up temporary files
const cleanupFiles = () => {
  const tempDir = path.resolve(__dirname, '..', 'temp');
  const logsDir = path.resolve(__dirname, '..', 'logs');

  [tempDir, logsDir].forEach(dir => {
    if (fs.existsSync(dir)) {
      print.info(`Cleaning up ${path.basename(dir)} directory...`);
      try {
        const files = fs.readdirSync(dir);
        files.forEach(file => {
          const filePath = path.join(dir, file);
          if (fs.statSync(filePath).isFile()) {
            fs.unlinkSync(filePath);
          }
        });
        print.success(`${path.basename(dir)} directory cleaned`);
      } catch (error) {
        print.error(`Error cleaning ${path.basename(dir)} directory:`);
        print.error(error.message);
      }
    }
  });
};

// Clean up process resources
const cleanupProcess = () => {
  // Clean up any timers
  const activeTimers = process._getActiveHandles().filter(handle => 
    handle.constructor.name === 'Timeout' || 
    handle.constructor.name === 'Interval'
  );

  activeTimers.forEach(timer => {
    if (timer.unref) timer.unref();
    if (timer.destroy) timer.destroy();
    else if (timer.close) timer.close();
  });

  // Clean up any open handles
  const activeHandles = process._getActiveHandles().filter(handle => 
    handle.constructor.name !== 'Timeout' && 
    handle.constructor.name !== 'Interval'
  );

  activeHandles.forEach(handle => {
    if (handle.destroy) handle.destroy();
    else if (handle.close) handle.close();
  });
};

// Main cleanup function
const cleanup = async () => {
  print.info('Starting cleanup process...');

  try {
    // Load environment variables
    loadEnv();

    // Clean up MongoDB connections
    await cleanupMongo();

    // Clean up temporary files
    cleanupFiles();

    // Clean up process resources
    cleanupProcess();

    print.success('Cleanup completed successfully');
  } catch (error) {
    print.error('Error during cleanup:');
    print.error(error.message);
  }
};

// Handle cleanup errors
process.on('uncaughtException', (error) => {
  print.error(`Uncaught Exception during cleanup: ${error.message}`);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  print.error('Unhandled Rejection during cleanup:', promise, 'reason:', reason);
  process.exit(1);
});

// Create required directories
const createDirectories = () => {
  const dirs = ['temp', 'logs'];
  dirs.forEach(dir => {
    const dirPath = path.resolve(__dirname, '..', dir);
    if (!fs.existsSync(dirPath)) {
      try {
        fs.mkdirSync(dirPath, { recursive: true });
        print.success(`Created ${dir} directory`);
      } catch (error) {
        print.error(`Error creating ${dir} directory:`);
        print.error(error.message);
      }
    }
  });
};

// Run cleanup
if (require.main === module) {
  createDirectories();
  cleanup().catch(error => {
    print.error('Fatal error during cleanup:');
    print.error(error.message);
    process.exit(1);
  });
}

module.exports = cleanup;
