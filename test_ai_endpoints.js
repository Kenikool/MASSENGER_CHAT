// Test script to check AI endpoints
console.log('🔍 Testing AI Endpoints...\n');

const testEndpoints = [
  {
    name: 'Smart Replies',
    url: 'http://localhost:9000/api/ai/smart-replies',
    method: 'POST',
    data: {
      message: 'How are you doing today?',
      context: []
    }
  },
  {
    name: 'Sentiment Analysis',
    url: 'http://localhost:9000/api/ai/sentiment',
    method: 'POST',
    data: {
      text: 'I love this amazing chat application!'
    }
  }
];

async function testEndpoint(endpoint) {
  try {
    console.log(`🧪 Testing ${endpoint.name}...`);
    console.log(`   URL: ${endpoint.url}`);
    
    const response = await fetch(endpoint.url, {
      method: endpoint.method,
      headers: {
        'Content-Type': 'application/json',
        // Note: This test doesn't include authentication
      },
      body: JSON.stringify(endpoint.data)
    });

    console.log(`   Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`   ✅ Success:`, data);
    } else {
      const errorText = await response.text();
      console.log(`   ❌ Error:`, errorText);
    }
    
  } catch (error) {
    console.log(`   ❌ Network Error:`, error.message);
  }
  
  console.log('');
}

async function runTests() {
  console.log('📋 AI Endpoint Tests\n');
  
  // Test server connectivity first
  try {
    console.log('🔗 Testing server connectivity...');
    const response = await fetch('http://localhost:9000/api/auth/check');
    console.log(`   Server Status: ${response.status}`);
    console.log('   ✅ Server is running\n');
  } catch (error) {
    console.log('   ❌ Server is not running or not accessible');
    console.log('   💡 Start backend with: cd backend && npm run dev\n');
    return;
  }
  
  // Test each AI endpoint
  for (const endpoint of testEndpoints) {
    await testEndpoint(endpoint);
  }
  
  console.log('🎯 Test Results Summary:');
  console.log('• If you see 401 Unauthorized: Authentication required (normal for protected routes)');
  console.log('• If you see 404 Not Found: Routes not properly registered');
  console.log('• If you see 500 Internal Server Error: Check server logs for details');
  console.log('• If you see network errors: Backend server not running');
  
  console.log('\n💡 Next Steps:');
  console.log('1. Ensure backend server is running: cd backend && npm run dev');
  console.log('2. Check server console for any error messages');
  console.log('3. Verify GEMINI_API_KEY is set in backend/.env');
  console.log('4. Test through the frontend with proper authentication');
}

// Run tests if this script is executed directly
if (typeof window === 'undefined') {
  runTests().catch(console.error);
} else {
  console.log('Run this in Node.js environment or browser console');
  window.testAIEndpoints = runTests;
}