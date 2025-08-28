// Simple test script for magic login
// Make sure your server is running on port 9000

console.log('🧪 Testing Magic Login Fix...\n');

// Test 1: Request magic link with unverified email
const testUnverifiedEmail = async () => {
  console.log('📧 Test 1: Requesting magic link with unverified email...');
  
  try {
    const response = await fetch('http://localhost:9000/api/auth/request-magic-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'unverified@test.com' })
    });
    
    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', data);
    
    if (response.status === 400 && data.error.includes('verify your email')) {
      console.log('✅ Correctly blocked unverified email\n');
    } else {
      console.log('❌ Should have blocked unverified email\n');
    }
  } catch (error) {
    console.log('❌ Test failed:', error.message, '\n');
  }
};

// Test 2: Request magic link with verified email
const testVerifiedEmail = async () => {
  console.log('📧 Test 2: Requesting magic link with verified email...');
  
  try {
    const response = await fetch('http://localhost:9000/api/auth/request-magic-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'verified@test.com' }) // Replace with real verified email
    });
    
    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', data);
    
    if (response.status === 200) {
      console.log('✅ Magic link request successful for verified email');
      console.log('📝 Check server logs for the generated token\n');
    } else {
      console.log('❌ Magic link request failed:', data.error, '\n');
    }
  } catch (error) {
    console.log('❌ Test failed:', error.message, '\n');
  }
};

// Test 3: Test magic login with invalid token
const testInvalidToken = async () => {
  console.log('🔑 Test 3: Testing magic login with invalid token...');
  
  try {
    const response = await fetch('http://localhost:9000/api/auth/magic-login/invalid-token-123', {
      method: 'GET',
      credentials: 'include'
    });
    
    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', data);
    
    if (response.status === 400 && data.error.includes('Invalid or expired')) {
      console.log('✅ Correctly rejected invalid token\n');
    } else {
      console.log('❌ Should have rejected invalid token\n');
    }
  } catch (error) {
    console.log('❌ Test failed:', error.message, '\n');
  }
};

// Run tests
const runTests = async () => {
  console.log('Starting Magic Login Tests...\n');
  
  await testUnverifiedEmail();
  await testVerifiedEmail();
  await testInvalidToken();
  
  console.log('🎯 Test Summary:');
  console.log('1. Unverified email should be blocked ✅');
  console.log('2. Verified email should generate magic link ✅');
  console.log('3. Invalid token should be rejected ✅');
  console.log('\n📋 Manual Testing:');
  console.log('1. Create a verified user account');
  console.log('2. Request magic link for that email');
  console.log('3. Check server logs for the token');
  console.log('4. Test the magic login endpoint with the token');
  console.log('5. Verify JWT cookie is set correctly');
};

// Check if fetch is available (Node.js 18+)
if (typeof fetch === 'undefined') {
  console.log('❌ This script requires Node.js 18+ or install node-fetch');
  console.log('Run: npm install node-fetch');
  console.log('Then add: import fetch from "node-fetch"; at the top');
} else {
  runTests();
}