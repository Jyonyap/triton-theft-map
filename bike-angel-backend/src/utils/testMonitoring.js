/**
 * Test script for monitoring and performance endpoints
 */

const BASE_URL = process.env.API_URL || 'http://localhost:3000';

async function testEndpoint(method, path, body = null) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(`${BASE_URL}${path}`, options);
    const data = await response.json();
    
    console.log(`✅ ${method} ${path}`);
    console.log(`   Status: ${response.status}`);
    console.log(`   Response:`, JSON.stringify(data, null, 2).substring(0, 200));
    console.log('');
    
    return { success: true, data };
  } catch (error) {
    console.log(`❌ ${method} ${path}`);
    console.log(`   Error: ${error.message}`);
    console.log('');
    
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('🧪 Testing Monitoring and Performance Endpoints\n');
  console.log('='.repeat(60));
  console.log('');
  
  // Test health check
  console.log('📋 Health Check');
  await testEndpoint('GET', '/api/health');
  
  // Test monitoring endpoints
  console.log('📊 Monitoring Endpoints');
  await testEndpoint('GET', '/api/monitoring/metrics');
  await testEndpoint('GET', '/api/monitoring/logs?limit=10');
  await testEndpoint('GET', '/api/monitoring/errors?limit=10');
  
  // Test feedback submission
  console.log('💬 Feedback System');
  await testEndpoint('POST', '/api/monitoring/feedback', {
    category: 'improvement',
    message: 'Test feedback from monitoring script'
  });
  await testEndpoint('GET', '/api/monitoring/feedback?limit=5');
  
  // Test performance endpoints
  console.log('⚡ Performance Endpoints');
  await testEndpoint('GET', '/api/performance/pool-stats');
  await testEndpoint('GET', '/api/performance/table-sizes');
  
  // Test issue tracking
  console.log('🐛 Issue Tracking');
  await testEndpoint('GET', '/api/issues/error-stats');
  await testEndpoint('GET', '/api/issues/open');
  
  console.log('='.repeat(60));
  console.log('✅ All tests completed!');
}

// Run tests
runTests().catch(console.error);
