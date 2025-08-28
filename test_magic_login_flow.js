// Test script for magic login functionality
// Run this with: node test_magic_login_flow.js

const testMagicLoginFlow = async () => {
  console.log('🧪 Testing Magic Login Flow...\n');
  
  const baseUrl = 'http://localhost:9000/api/auth';
  const testEmail = 'test@example.com'; // Replace with a real verified email
  
  try {
    // Step 1: Request magic link
    console.log('📧 Step 1: Requesting magic link...');
    const response = await fetch(`${baseUrl}/request-magic-link`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: testEmail })
    });
    
    const data = await response.json();
    console.log('Response Status:', response.status);
    console.log('Response Data:', data);
    
    if (response.ok) {
      console.log('✅ Magic link request successful!');
      console.log('📝 Check your email for the magic link');
      console.log('📝 Or check the server logs for the token');
    } else {
      console.log('❌ Magic link request failed:', data.error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

// Test with a sample token (you'll get this from the server logs)
const testMagicLoginWithToken = async (token) => {
  console.log(`\n🔑 Testing magic login with token: ${token}`);
  
  const baseUrl = 'http://localhost:9000/api/auth';
  
  try {
    const response = await fetch(`${baseUrl}/magic-login/${token}`, {
      method: 'GET',
      credentials: 'include'
    });
    
    const data = await response.json();
    console.log('Response Status:', response.status);
    console.log('Response Data:', data);
    
    if (response.ok) {
      console.log('✅ Magic login successful!');
    } else {
      console.log('❌ Magic login failed:', data.error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

// Run the test
console.log('Starting Magic Login Tests...\n');

// Test 1: Request magic link
testMagicLoginFlow();

// Test 2: Test with a token (uncomment and add a real token)
// testMagicLoginWithToken('your-token-here');

console.log('\n📋 Manual Testing Steps:');
console.log('1. Run the server: npm run dev (in backend)');
console.log('2. Run this test script');
console.log('3. Check server logs for the generated token');
console.log('4. Test the magic login endpoint with the token');
console.log('5. Check if JWT cookie is set correctly');