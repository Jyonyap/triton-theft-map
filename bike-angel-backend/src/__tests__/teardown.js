/**
 * Test Teardown
 * Global teardown for integration tests
 */

/**
 * Global teardown - runs after all tests
 */
export default async function globalTeardown() {
  console.log('🧹 Cleaning up test server...');
  
  const serverProcess = global.__SERVER_PROCESS__;
  if (serverProcess) {
    serverProcess.kill();
    console.log('✅ Server stopped');
  }
}
