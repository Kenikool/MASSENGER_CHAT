// Comprehensive test script for verification fixes
console.log('🧪 Testing Email Verification and Magic Login Fixes...\n');

const baseUrl = 'http://localhost:9000/api/auth';

// Test 1: Create a new account
const testSignup = async () => {
  console.log('📝 Test 1: Creating new account...');
  
  const testUser = {
    fullName: 'Test User',
    email: `test${Date.now()}@example.com`,
    password: 'TestPassword123!'
  };
  
  try {
    const response = await fetch(`${baseUrl}/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser)
    });
    
    const data = await response.json();
    console.log('Signup Response:', response.status, data);
    
    if (response.ok) {
      console.log('✅ Account created successfully');
      console.log('📧 Check server logs for verification email details');
      return testUser.email;
    } else {
      console.log('❌ Signup failed:', data.message);
      return null;
    }
  } catch (error) {
    console.log('❌ Signup test failed:', error.message);
    return null;
  }
};

// Test 2: Test email verification with a token
const testEmailVerification = async (token) => {
  console.log(`\n🔑 Test 2: Testing email verification with token: ${token}`);
  
  try {
    const response = await fetch(`${baseUrl}/verify-account?token=${token}`, {
      method: 'GET',
      credentials: 'include'
    });
    
    const data = await response.json();
    console.log('Verification Response:', response.status, data);
    
    if (response.ok) {
      console.log('✅ Email verification successful');
    } else {
      console.log('❌ Email verification failed:', data.error);
    }
  } catch (error) {
    console.log('❌ Verification test failed:', error.message);
  }
};

// Test 3: Test magic link request
const testMagicLinkRequest = async (email) => {
  console.log(`\n🪄 Test 3: Testing magic link request for: ${email}`);
  
  try {
    const response = await fetch(`${baseUrl}/request-magic-link`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    
    const data = await response.json();
    console.log('Magic Link Request Response:', response.status, data);
    
    if (response.ok) {
      console.log('✅ Magic link request successful');
      console.log('📧 Check server logs for magic link details');
    } else {
      console.log('❌ Magic link request failed:', data.error);
    }
  } catch (error) {
    console.log('❌ Magic link test failed:', error.message);
  }
};

// Test 4: Test magic login with token
const testMagicLogin = async (token) => {
  console.log(`\n🔐 Test 4: Testing magic login with token: ${token}`);
  
  try {
    const response = await fetch(`${baseUrl}/magic-login/${token}`, {
      method: 'GET',
      credentials: 'include'
    });
    
    const data = await response.json();
    console.log('Magic Login Response:', response.status, data);
    
    if (response.ok) {
      console.log('✅ Magic login successful');
    } else {
      console.log('❌ Magic login failed:', data.error);
    }
  } catch (error) {
    console.log('❌ Magic login test failed:', error.message);
  }
};

// Main test runner
const runTests = async () => {
  console.log('🚀 Starting comprehensive verification tests...\n');
  
  // Test 1: Signup
  const email = await testSignup();
  
  if (email) {
    console.log('\n📋 Manual Testing Steps:');
    console.log('1. Check server logs for verification token');
    console.log('2. Copy the token from the logs');
    console.log('3. Test email verification with the token');
    console.log('4. After verification, test magic link request');
    console.log('5. Test magic login with the magic token');
    
    console.log('\n🔧 Example commands:');
    console.log(`testEmailVerification('YOUR_VERIFICATION_TOKEN_HERE')`);
    console.log(`testMagicLinkRequest('${email}')`);
    console.log(`testMagicLogin('YOUR_MAGIC_TOKEN_HERE')`);
  }
  
  console.log('\n🎯 What to look for in server logs:');
  console.log('- "Verification email sent successfully"');
  console.log('- "Verification token: [token]"');
  console.log('- "Email verification successful for user"');
  console.log('- "Magic link requested for user"');
  console.log('- "Magic login successful for user"');
};

// Export functions for manual testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    testSignup,
    testEmailVerification,
    testMagicLinkRequest,
    testMagicLogin,
    runTests
  };
}

// Check if fetch is available
if (typeof fetch === 'undefined') {
  console.log('❌ This script requires Node.js 18+ or install node-fetch');
  console.log('For Node.js < 18, run: npm install node-fetch');
  console.log('Then add: import fetch from "node-fetch"; at the top');
} else {
  runTests();
}