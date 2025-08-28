// Quick test script for Gemini API setup
console.log('🤖 Testing Gemini API Setup...\n');

// Check if .env file exists
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, 'backend', '.env');
const envExamplePath = path.join(__dirname, 'backend', '.env.example');

console.log('📁 Checking environment files:');

if (fs.existsSync(envPath)) {
  console.log('✅ backend/.env file exists');
  
  try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    
    if (envContent.includes('GEMINI_API_KEY=')) {
      const apiKeyLine = envContent.split('\n').find(line => line.startsWith('GEMINI_API_KEY='));
      const apiKey = apiKeyLine ? apiKeyLine.split('=')[1] : '';
      
      if (apiKey && apiKey.trim() && apiKey !== 'your_gemini_api_key_here') {
        console.log('✅ GEMINI_API_KEY is configured');
        console.log(`   Key starts with: ${apiKey.substring(0, 10)}...`);
      } else {
        console.log('❌ GEMINI_API_KEY is not set or using placeholder value');
        console.log('   Please add your actual Gemini API key');
      }
    } else {
      console.log('❌ GEMINI_API_KEY not found in .env file');
      console.log('   Please add: GEMINI_API_KEY=your_api_key_here');
    }
  } catch (error) {
    console.log('❌ Could not read .env file');
  }
} else {
  console.log('❌ backend/.env file not found');
  
  if (fs.existsSync(envExamplePath)) {
    console.log('💡 Found .env.example file');
    console.log('   Copy it to .env and fill in your values:');
    console.log('   cp backend/.env.example backend/.env');
  } else {
    console.log('❌ No .env.example file found either');
  }
}

console.log('\n🔑 How to get your Gemini API key:');
console.log('1. Go to: https://makersuite.google.com/app/apikey');
console.log('2. Sign in with Google account');
console.log('3. Click "Create API Key"');
console.log('4. Copy the key (starts with AIzaSy...)');
console.log('5. Add to backend/.env: GEMINI_API_KEY=your_key_here');

console.log('\n🧪 Testing checklist:');
console.log('- [ ] Get Gemini API key');
console.log('- [ ] Add to backend/.env file');
console.log('- [ ] Restart backend server');
console.log('- [ ] Test smart replies in chat');
console.log('- [ ] Use test panel (🧪 icon) to verify');

console.log('\n🚀 Expected behavior:');
console.log('✅ Smart replies appear after receiving messages');
console.log('✅ AI features work in test panel');
console.log('✅ No "API key not found" warnings in server console');
console.log('✅ Fast AI responses (< 2 seconds)');

console.log('\n💡 Typing indicator margin:');
console.log('✅ Fixed: Added mb-4 class for bottom margin');
console.log('✅ Typing indicator now has proper spacing');

console.log('\n🎯 Ready to test! Start your servers and try the AI features! 🤖');