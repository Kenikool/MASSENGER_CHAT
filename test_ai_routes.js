// Test script to verify AI routes are working
console.log('🤖 Testing AI Routes...\n');

// Test data
const testCases = [
  {
    name: 'Smart Replies',
    endpoint: '/api/ai/smart-replies',
    method: 'POST',
    data: {
      message: 'How are you doing today?',
      context: ['Hello there', 'Nice to meet you']
    },
    expectedResponse: 'suggestions array'
  },
  {
    name: 'Sentiment Analysis',
    endpoint: '/api/ai/sentiment',
    method: 'POST',
    data: {
      text: 'I love this amazing chat application!'
    },
    expectedResponse: 'sentiment object with label, score, emoji'
  },
  {
    name: 'Translation',
    endpoint: '/api/ai/translate',
    method: 'POST',
    data: {
      text: 'Hello, how are you?',
      targetLang: 'es'
    },
    expectedResponse: 'translation object'
  },
  {
    name: 'Spam Detection',
    endpoint: '/api/ai/detect-spam',
    method: 'POST',
    data: {
      text: 'Click here for free money! Act now!'
    },
    expectedResponse: 'spam detection result'
  },
  {
    name: 'Auto-complete',
    endpoint: '/api/ai/autocomplete',
    method: 'POST',
    data: {
      partialText: 'How'
    },
    expectedResponse: 'completions array'
  },
  {
    name: 'Content Moderation',
    endpoint: '/api/ai/moderate',
    method: 'POST',
    data: {
      text: 'This is a normal message'
    },
    expectedResponse: 'moderation result'
  }
];

console.log('📋 AI Routes Test Cases:\n');

testCases.forEach((test, index) => {
  console.log(`${index + 1}. ${test.name}`);
  console.log(`   Endpoint: ${test.method} ${test.endpoint}`);
  console.log(`   Data: ${JSON.stringify(test.data, null, 2)}`);
  console.log(`   Expected: ${test.expectedResponse}`);
  console.log('');
});

console.log('🧪 Manual Testing Instructions:\n');

console.log('1. Start your backend server:');
console.log('   cd backend && npm run dev\n');

console.log('2. Test with curl or Postman:');
console.log('   Example curl command:');
console.log('   curl -X POST http://localhost:9000/api/ai/smart-replies \\');
console.log('        -H "Content-Type: application/json" \\');
console.log('        -H "Authorization: Bearer YOUR_JWT_TOKEN" \\');
console.log('        -d \'{"message": "How are you?", "context": []}\'\n');

console.log('3. Or test through the frontend:');
console.log('   - Login to the chat application');
console.log('   - Send a message and look for smart reply suggestions');
console.log('   - Check browser Network tab for AI API calls\n');

console.log('🔍 What to Look For:\n');

console.log('✅ Server starts without errors');
console.log('✅ AI routes are registered (check server logs)');
console.log('✅ API calls return responses (even if AI is slow)');
console.log('✅ Fallback responses work when AI fails');
console.log('✅ No authentication errors (JWT token required)');

console.log('\n⚠️ Common Issues:\n');

console.log('• 401 Unauthorized: Need to login and get JWT token');
console.log('• 500 Server Error: Check if aiService.js is imported correctly');
console.log('• Network timeout: Hugging Face API might be slow (normal)');
console.log('• CORS errors: Check frontend is running on allowed origin');

console.log('\n🚀 Quick Frontend Test:\n');

console.log('Add this to your browser console (after login):');
console.log(`
// Test smart replies
fetch('/api/ai/smart-replies', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include',
  body: JSON.stringify({
    message: 'How are you?',
    context: []
  })
})
.then(res => res.json())
.then(data => console.log('Smart replies:', data))
.catch(err => console.error('Error:', err));
`);

console.log('\n🎯 Expected Results:\n');

console.log('✅ Smart replies: Array of suggested responses');
console.log('✅ Sentiment: Object with label (POSITIVE/NEGATIVE/NEUTRAL)');
console.log('✅ Translation: Object with original and translated text');
console.log('✅ Spam detection: Object with isSpam boolean');
console.log('✅ Auto-complete: Array of completion suggestions');
console.log('✅ Moderation: Object with needsModeration boolean');

console.log('\n🎉 If all tests pass, your AI features are ready! 🤖');

// Function to test if server is running
async function checkServerStatus() {
  try {
    const response = await fetch('http://localhost:9000/api/auth/check', {
      method: 'GET',
      credentials: 'include'
    });
    
    if (response.ok || response.status === 401) {
      console.log('✅ Backend server is running on port 9000');
    } else {
      console.log('⚠️ Backend server might not be running');
    }
  } catch (error) {
    console.log('❌ Backend server is not running or not accessible');
    console.log('   Start it with: cd backend && npm run dev');
  }
}

// Only run server check if we're in a browser environment
if (typeof window !== 'undefined') {
  checkServerStatus();
}