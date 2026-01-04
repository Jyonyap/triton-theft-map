/**
 * Test Setup
 * Global setup for integration tests
 */

import { spawn } from 'child_process';
import fetch from 'node-fetch';

let serverProcess = null;
const API_URL = process.env.API_URL || 'http://localhost:3000';
const MAX_RETRIES = 30;
const RETRY_DELAY = 1000;

/**
 * Wait for server to be ready
 */
async function waitForServer() {
  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      const response = await fetch(`${API_URL}/health`);
      if (response.ok) {
        console.log('✅ Server is ready');
        return true;
      }
    } catch (error) {
      // Server not ready yet
    }
    await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
  }
  throw new Error('Server failed to start within timeout period');
}

/**
 * Global setup - runs before all tests
 */
export default async function globalSetup() {
  console.log('🚀 Starting test server...');
  
  // Check if server is already running
  try {
    const response = await fetch(`${API_URL}/health`);
    if (response.ok) {
      console.log('✅ Server already running');
      return;
    }
  } catch (error) {
    // Server not running, start it
  }
  
  // Start the server
  serverProcess = spawn('node', ['src/server.js'], {
    cwd: process.cwd(),
    env: { ...process.env, NODE_ENV: 'test' },
    stdio: 'inherit'
  });
  
  // Wait for server to be ready
  await waitForServer();
  
  // Store process ID for cleanup
  global.__SERVER_PROCESS__ = serverProcess;
}
