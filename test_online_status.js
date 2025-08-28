// Test script for online/offline status functionality
console.log('🧪 Testing Online/Offline Status System...\n');

const testOnlineStatus = () => {
  console.log('📋 Manual Testing Steps for Online/Offline Status:\n');
  
  console.log('1. 🔐 Login with two different accounts in different browsers/tabs');
  console.log('   - User A: Login in Chrome');
  console.log('   - User B: Login in Firefox or Incognito\n');
  
  console.log('2. 👀 Check Sidebar Status Display:');
  console.log('   - Both users should see each other as "Online"');
  console.log('   - Green dot should appear next to online users');
  console.log('   - Status should show "Online" in green text\n');
  
  console.log('3. 📱 Check Profile Page Status:');
  console.log('   - Go to your own profile');
  console.log('   - Should show "Online" with green pulsing dot');
  console.log('   - Status badge should be green with proper styling\n');
  
  console.log('4. 🔌 Test Disconnect:');
  console.log('   - Close one browser tab/window');
  console.log('   - Other user should see them as "Offline"');
  console.log('   - Gray dot should appear');
  console.log('   - Status should show "Offline" in gray text\n');
  
  console.log('5. 🕐 Test Last Seen:');
  console.log('   - After user goes offline');
  console.log('   - Should show "Last seen X time ago"');
  console.log('   - Time should be relative (e.g., "2 minutes ago")\n');
  
  console.log('6. 🔄 Test Reconnection:');
  console.log('   - Refresh the page or reopen browser');
  console.log('   - User should appear online again');
  console.log('   - Status should update in real-time for other users\n');
  
  console.log('🔍 What to Look For in Server Logs:');
  console.log('- "User added to socket map: [userId] [socketId]"');
  console.log('- "User [userId] marked as offline"');
  console.log('- "Received online users: [array of userIds]"');
  console.log('- Socket connection/disconnection messages\n');
  
  console.log('🎯 Expected Behavior:');
  console.log('✅ Online users show green dot and "Online" status');
  console.log('✅ Offline users show gray dot and "Last seen" time');
  console.log('✅ Status updates in real-time across all connected clients');
  console.log('✅ Profile page shows correct online/offline status');
  console.log('✅ Sidebar shows consistent status indicators');
  console.log('✅ Database stores lastSeen and isOnline fields correctly\n');
  
  console.log('🚨 Common Issues to Check:');
  console.log('❌ Users stuck as "Online" after disconnect');
  console.log('❌ Status not updating in real-time');
  console.log('❌ Inconsistent status between sidebar and profile');
  console.log('❌ Socket connection errors in console');
  console.log('❌ Missing green/gray dots or wrong colors\n');
  
  console.log('🔧 Debugging Tips:');
  console.log('1. Check browser console for socket connection errors');
  console.log('2. Verify server logs show proper connect/disconnect events');
  console.log('3. Check if onlineUsers array is being updated correctly');
  console.log('4. Ensure userId is properly passed in socket handshake');
  console.log('5. Verify database updates for lastSeen and isOnline fields');
};

// Database query examples for manual testing
const databaseQueries = () => {
  console.log('\n📊 Database Queries for Testing:\n');
  
  console.log('// Check user online status in MongoDB');
  console.log('db.users.find({}, { fullName: 1, email: 1, isOnline: 1, lastSeen: 1 });\n');
  
  console.log('// Find all online users');
  console.log('db.users.find({ isOnline: true }, { fullName: 1, email: 1 });\n');
  
  console.log('// Find all offline users with recent activity');
  console.log('db.users.find({ isOnline: false, lastSeen: { $gte: new Date(Date.now() - 24*60*60*1000) } });\n');
  
  console.log('// Update user online status manually (for testing)');
  console.log('db.users.updateOne({ email: "test@example.com" }, { $set: { isOnline: true, lastSeen: new Date() } });');
};

// Run the test guide
testOnlineStatus();
databaseQueries();

console.log('\n🎉 Start testing the online/offline status system!');
console.log('Remember to check both frontend UI and backend logs for complete verification.');