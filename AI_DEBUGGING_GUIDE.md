# 🔧 AI Features Debugging Guide

## 🚨 **Common Error: 404 Not Found**

### **Symptoms:**
- AI Smart Replies test failed: Request failed with status code 404
- AI Sentiment Analysis test failed: Request failed with status code 404

### **Root Causes & Solutions:**

#### **1. Backend Server Not Running**
**Check:**
```bash
# Is backend running?
curl http://localhost:9000/api/ai/health
```

**Solution:**
```bash
cd backend
npm run dev
```

**Expected Output:**
```
📋 Registered API routes:
  • /api/auth - Authentication routes
  • /api/messages - Message routes
  • /api/users - User routes
  • /api/gamification - Gamification routes
  • /api/reactions - Reaction routes
  • /api/groups - Group routes
  • /api/ai - AI routes (including /health)

Server running on port 9000
```

#### **2. Routes Not Properly Registered**
**Check server.js imports:**
```javascript
// Should see this in backend/server.js
import aiRoutes from "./routes/ai.routes.js";
app.use("/api/ai", aiRoutes);
```

**Verify file exists:**
```bash
ls backend/routes/ai.routes.js
```

#### **3. Port Mismatch**
**Check if backend is running on correct port:**
- Backend should be on port 9000
- Frontend should be on port 5173
- Check `backend/.env` for PORT setting

---

## 🔍 **Step-by-Step Debugging**

### **Step 1: Test Server Connectivity**
```bash
# Test if server is running
curl http://localhost:9000/api/auth/check

# Expected: 401 Unauthorized (normal, means server is running)
# Error: Connection refused (server not running)
```

### **Step 2: Test AI Health Endpoint**
```bash
# Test AI routes specifically
curl http://localhost:9000/api/ai/health

# Expected response:
{
  "status": "AI routes are working",
  "timestamp": "2024-01-27T...",
  "geminiConfigured": true/false
}
```

### **Step 3: Check Authentication**
```javascript
// In browser console (after login):
fetch('/api/ai/health')
  .then(res => res.json())
  .then(data => console.log('AI Health:', data));
```

### **Step 4: Test with Authentication**
```javascript
// In browser console (after login):
fetch('/api/ai/smart-replies', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    message: 'Hello',
    context: []
  })
})
.then(res => res.json())
.then(data => console.log('Smart Replies:', data))
.catch(err => console.error('Error:', err));
```

---

## 🔧 **Quick Fixes**

### **Fix 1: Restart Backend Server**
```bash
# Stop server (Ctrl+C)
cd backend
npm run dev
```

### **Fix 2: Check Environment Variables**
```bash
# Check if .env exists
ls backend/.env

# Check if GEMINI_API_KEY is set
grep GEMINI_API_KEY backend/.env
```

### **Fix 3: Verify Route Registration**
Add this to `backend/server.js` after route registration:
```javascript
// Debug route registration
app.get('/debug/routes', (req, res) => {
  const routes = [];
  app._router.stack.forEach(middleware => {
    if (middleware.route) {
      routes.push(middleware.route.path);
    } else if (middleware.name === 'router') {
      middleware.handle.stack.forEach(handler => {
        if (handler.route) {
          routes.push(handler.route.path);
        }
      });
    }
  });
  res.json({ routes });
});
```

### **Fix 4: Test AI Service Directly**
```javascript
// In backend console or test file
import aiService from './services/aiService.js';

// Test smart replies
aiService.generateSmartReplies('Hello')
  .then(replies => console.log('Replies:', replies))
  .catch(err => console.error('Error:', err));
```

---

## 📊 **Diagnostic Checklist**

### **Backend Checklist:**
- [ ] Backend server running on port 9000
- [ ] AI routes file exists: `backend/routes/ai.routes.js`
- [ ] AI service file exists: `backend/services/aiService.js`
- [ ] Routes registered in `backend/server.js`
- [ ] GEMINI_API_KEY set in `backend/.env`
- [ ] No import/export errors in console

### **Frontend Checklist:**
- [ ] Frontend running on port 5173
- [ ] User is logged in (has JWT token)
- [ ] No CORS errors in browser console
- [ ] Network requests going to correct URLs
- [ ] axiosInstance configured correctly

### **API Checklist:**
- [ ] `/api/ai/health` returns 200 OK
- [ ] `/api/ai/smart-replies` returns 401 (auth required) or 200 (if authenticated)
- [ ] Gemini API key is valid
- [ ] No rate limiting issues

---

## 🎯 **Expected Behavior**

### **When Working Correctly:**
1. **Health Check:** `GET /api/ai/health` returns status info
2. **Authentication:** Protected routes return 401 without login
3. **Smart Replies:** Returns array of suggestions when authenticated
4. **Sentiment:** Returns sentiment object with label/score/emoji
5. **No 404 errors** for any AI endpoints

### **Test Commands:**
```bash
# Test health (no auth required)
curl http://localhost:9000/api/ai/health

# Test smart replies (requires auth - will return 401)
curl -X POST http://localhost:9000/api/ai/smart-replies \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello","context":[]}'
```

---

## 🚀 **Quick Resolution Steps**

### **If Getting 404 Errors:**
1. **Restart backend server:** `cd backend && npm run dev`
2. **Check server logs** for route registration messages
3. **Verify file exists:** `ls backend/routes/ai.routes.js`
4. **Test health endpoint:** `curl http://localhost:9000/api/ai/health`

### **If Getting 401 Errors:**
1. **Login to the application** first
2. **Test through browser** (not curl) to include cookies
3. **Check JWT token** in browser dev tools

### **If Getting 500 Errors:**
1. **Check Gemini API key** in `backend/.env`
2. **Check server console** for detailed error messages
3. **Verify API key is valid** and has proper permissions

---

## 💡 **Pro Tips**

### **Browser Testing:**
```javascript
// Run in browser console after login
window.testAIEndpoints = async () => {
  try {
    const health = await fetch('/api/ai/health').then(r => r.json());
    console.log('Health:', health);
    
    const replies = await fetch('/api/ai/smart-replies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ message: 'Hello', context: [] })
    }).then(r => r.json());
    console.log('Replies:', replies);
  } catch (err) {
    console.error('Test failed:', err);
  }
};

// Run the test
testAIEndpoints();
```

### **Server Debugging:**
Add this to any AI route for debugging:
```javascript
router.post("/smart-replies", protectedRoute, async (req, res) => {
  console.log('🔍 Smart replies endpoint hit');
  console.log('Body:', req.body);
  console.log('User:', req.user?._id);
  // ... rest of route
});
```

**Once you follow these steps, the AI features should work correctly!** 🤖✨