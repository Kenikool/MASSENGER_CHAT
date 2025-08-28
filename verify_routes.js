// Verification script for all routes
const fs = require('fs');

console.log('🔍 Verifying All Routes Setup...\n');

// Check if all route files exist
const routeFiles = [
  'backend/routes/auth.routes.js',
  'backend/routes/message.routes.js', 
  'backend/routes/user.routes.js',
  'backend/routes/gamification.routes.js',
  'backend/routes/reaction.routes.js',
  'backend/routes/group.routes.js',
  'backend/routes/ai.route.js'
];

console.log('📁 Checking route files:');
let allRoutesExist = true;

routeFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING!`);
    allRoutesExist = false;
  }
});

// Check server.js imports
console.log('\n📦 Checking server.js imports:');

try {
  const serverContent = fs.readFileSync('backend/server.js', 'utf8');
  
  const expectedImports = [
    'authRoutes',
    'messageRoutes', 
    'userRoutes',
    'gamificationRoutes',
    'reactionRoutes',
    'groupRoutes',
    'aiRoutes'
  ];

  expectedImports.forEach(importName => {
    if (serverContent.includes(importName)) {
      console.log(`✅ ${importName} imported`);
    } else {
      console.log(`❌ ${importName} - NOT IMPORTED!`);
      allRoutesExist = false;
    }
  });

  // Check route registrations
  console.log('\n🛣️ Checking route registrations:');
  
  const expectedRoutes = [
    'app.use("/api/auth", authRoutes)',
    'app.use("/api/messages", messageRoutes)',
    'app.use("/api/users", userRoutes)', 
    'app.use("/api/gamification", gamificationRoutes)',
    'app.use("/api/reactions", reactionRoutes)',
    'app.use("/api/groups", groupRoutes)',
    'app.use("/api/ai", aiRoutes)'
  ];

  expectedRoutes.forEach(route => {
    if (serverContent.includes(route)) {
      console.log(`✅ ${route}`);
    } else {
      console.log(`❌ ${route} - NOT REGISTERED!`);
      allRoutesExist = false;
    }
  });

} catch (error) {
  console.log('❌ Could not read server.js file');
  allRoutesExist = false;
}

// Check supporting files
console.log('\n🔧 Checking supporting files:');

const supportingFiles = [
  'backend/services/aiService.js',
  'backend/models/MessageReaction.js',
  'backend/models/Group.js',
  'backend/controllers/reaction.controller.js',
  'backend/controllers/group.controller.js'
];

supportingFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING!`);
    allRoutesExist = false;
  }
});

console.log('\n📊 Summary:');

if (allRoutesExist) {
  console.log('✅ All routes and files are properly set up!');
  console.log('\n🚀 Available API endpoints:');
  console.log('• /api/auth/* - Authentication routes');
  console.log('• /api/messages/* - Message routes');
  console.log('• /api/users/* - User routes');
  console.log('• /api/gamification/* - Gamification routes');
  console.log('• /api/reactions/* - Message reaction routes');
  console.log('• /api/groups/* - Group chat routes');
  console.log('• /api/ai/* - AI-powered features routes');
  
  console.log('\n🧪 Ready for testing!');
  console.log('Run: node test_ai_routes.js for AI-specific testing');
} else {
  console.log('❌ Some routes or files are missing!');
  console.log('Please check the missing files and fix the imports.');
}

console.log('\n🎯 Next steps:');
console.log('1. Start backend: cd backend && npm run dev');
console.log('2. Start frontend: cd client && npm run dev'); 
console.log('3. Test AI routes: node test_ai_routes.js');
console.log('4. Follow TESTING_GUIDE.md for complete testing');

console.log('\n🎉 Happy testing! 🚀');