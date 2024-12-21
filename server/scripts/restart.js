#!/usr/bin/env node

/**
 * Server restart script with cleanup
 */

const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');

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

// Clean up function
const cleanup = () => {
  print.info('Starting cleanup...');

  // Remove node_modules
  if (fs.existsSync('node_modules')) {
    print.info('Removing node_modules...');
    fs.rmSync('node_modules', { recursive: true, force: true });
    print.success('node_modules removed');
  }

  // Clear npm cache
  print.info('Clearing npm cache...');
  exec('npm cache clean --force', (error) => {
    if (error) {
      print.error(`Failed to clear npm cache: ${error.message}`);
    } else {
      print.success('npm cache cleared');
    }
  });
};

// Install dependencies
const install = () => new Promise((resolve, reject) => {
  print.info('Installing dependencies...');
  
  const npm = spawn(/^win/.test(process.platform) ? 'npm.cmd' : 'npm', ['install'], {
    stdio: 'inherit',
  });

  npm.on('close', (code) => {
    if (code === 0) {
      print.success('Dependencies installed successfully');
      resolve();
    } else {
      print.error(`npm install failed with code ${code}`);
      reject(new Error(`npm install failed with code ${code}`));
    }
  });
});

// Start server
const startServer = () => new Promise((resolve, reject) => {
  print.info('Starting server...');
  
  const npm = spawn(/^win/.test(process.platform) ? 'npm.cmd' : 'npm', ['run', 'dev'], {
    stdio: 'inherit',
  });

  npm.on('close', (code) => {
    if (code === 0) {
      print.success('Server started successfully');
      resolve();
    } else {
      print.error(`Server failed to start with code ${code}`);
      reject(new Error(`Server failed to start with code ${code}`));
    }
  });
});

// Main function
const main = async () => {
  try {
    // Change to server directory
    const serverDir = path.resolve(__dirname, '..');
    process.chdir(serverDir);
    print.info(`Working directory: ${process.cwd()}`);

    // Run cleanup
    cleanup();

    // Install dependencies
    await install();

    // Start server
    await startServer();
  } catch (error) {
    print.error(`Failed to restart server: ${error.message}`);
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
