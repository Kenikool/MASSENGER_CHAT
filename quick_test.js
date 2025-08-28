// Quick test script to verify server setup
const fs = require('fs');
const path = require('path');

console.log('🔍 Quick Setup Verification\n');

// Check if all required files exist
const requiredFiles = [
  'backend/models/MessageReaction.js',
  'backend/models/Group.js', 
  'backend/controllers/reaction.controller.js',
  'backend/controllers/group.controller.js',
  'backend/services/aiService.js',
  'backend/routes/reaction.route.js',
  'backend/routes/group.route.js',
  'backend/routes/ai.route.js',
  'client/src/services/voiceService.js',
  'client/src/components/VoiceRecorder.jsx',
  'client/src/components/MessageReply.jsx',
  'client/src/components/SmartReplies.jsx'
];

console.log('📁 Checking required files:');
let allFilesExist = true;

requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING!`);
    allFilesExist = false;
  }
});

console.log('\n📦 Checking package.json dependencies:');

// Check backend package.json
try {
  const backendPkg = JSON.parse(fs.readFileSync('backend/package.json', 'utf8'));
  const requiredDeps = ['express', 'mongoose', 'socket.io', 'cors', 'cookie-parser'];
  
  requiredDeps.forEach(dep => {
    if (backendPkg.dependencies && backendPkg.dependencies[dep]) {
      console.log(`✅ Backend: ${dep}`);
    } else {
      console.log(`❌ Backend: ${dep} - MISSING!`);
      allFilesExist = false;
    }
  });
} catch (error) {
  console.log('❌ Backend package.json not found or invalid');
  allFilesExist = false;
}

// Check frontend package.json
try {
  const frontendPkg = JSON.parse(fs.readFileSync('client/package.json', 'utf8'));
  const requiredDeps = ['react', 'socket.io-client', 'axios', 'lucide-react'];
  
  requiredDeps.forEach(dep => {
    if (frontendPkg.dependencies && frontendPkg.dependencies[dep]) {
      console.log(`✅ Frontend: ${dep}`);
    } else {
      console.log(`❌ Frontend: ${dep} - MISSING!`);
      allFilesExist = false;
    }
  });
} catch (error) {
  console.log('❌ Frontend package.json not found or invalid');
  allFilesExist = false;
}

console.log('\n🔧 Environment Setup:');

// Check .env file
if (fs.existsSync('backend/.env')) {
  console.log('✅ Backend .env file exists');
  
  try {
    const envContent = fs.readFileSync('backend/.env', 'utf8');
    const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET', 'PORT'];
    
    requiredEnvVars.forEach(envVar => {
      if (envContent.includes(envVar)) {
        console.log(`✅ ${envVar} configured`);
      } else {
        console.log(`⚠️ ${envVar} not found in .env`);
      }
    });
  } catch (error) {
    console.log('❌ Could not read .env file');
  }
} else {
  console.log('⚠️ Backend .env file not found');
}

console.log('\n🚀 Next Steps:');

if (allFilesExist) {
  console.log('✅ All files are in place!');
  console.log('\n📋 To start testing:');
  console.log('1. cd backend && npm run dev');
  console.log('2. cd client && npm run dev');
  console.log('3. Open http://localhost:5173');
  console.log('4. Follow the TESTING_GUIDE.md');
} else {
  console.log('❌ Some files are missing!');
  console.log('Please ensure all files were created correctly.');
}

console.log('\n🧪 Test Commands:');
console.log('• node test_all_features.js - Full testing guide');
console.log('• node quick_test.js - This verification script');
console.log('• Check TESTING_GUIDE.md for detailed instructions');

console.log('\n🎯 Happy Testing! 🚀');