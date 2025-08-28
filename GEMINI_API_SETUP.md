# 🤖 Google Gemini API Setup Guide

## 🔑 **How to Get Your Gemini API Key**

### **Step 1: Get Your API Key**
1. Go to **Google AI Studio**: https://makersuite.google.com/app/apikey
2. Sign in with your Google account
3. Click **"Create API Key"**
4. Copy your API key (it looks like: `AIzaSyC...`)

### **Step 2: Add API Key to Your Project**

#### **Option 1: Add to .env file (Recommended)**
1. Open `backend/.env` file
2. Add this line:
```bash
GEMINI_API_KEY=AIzaSyC_your_actual_api_key_here
```

#### **Option 2: Create .env file if it doesn't exist**
1. Copy `backend/.env.example` to `backend/.env`
2. Fill in all the required values including:
```bash
GEMINI_API_KEY=AIzaSyC_your_actual_api_key_here
```

### **Step 3: Restart Your Backend Server**
```bash
cd backend
npm run dev
```

---

## ✅ **Verify API Key is Working**

### **Check Server Logs:**
When you start the backend, you should see:
- ✅ **No warnings** about missing GEMINI_API_KEY
- ❌ If you see: `⚠️ GEMINI_API_KEY not found` → API key not set correctly

### **Test AI Features:**
1. **Open your chat app**
2. **Send a message** to another user
3. **Look for smart reply suggestions** above the message input
4. **Use the test panel** (🧪 icon) to test individual AI features

---

## 🧪 **Testing AI Features**

### **1. Smart Replies Test:**
```bash
# Should work after receiving a message
POST /api/ai/smart-replies
{
  "message": "How are you doing today?",
  "context": []
}
```

### **2. Sentiment Analysis Test:**
```bash
POST /api/ai/sentiment
{
  "text": "I love this amazing chat application!"
}
```

### **3. Translation Test:**
```bash
POST /api/ai/translate
{
  "text": "Hello, how are you?",
  "targetLang": "es"
}
```

---

## 🔧 **Troubleshooting**

### **Common Issues:**

#### **1. "Gemini API key not configured" Error**
- ✅ **Solution**: Add `GEMINI_API_KEY=your_key` to `backend/.env`
- ✅ **Restart** the backend server

#### **2. "API key not found" Warning**
- ✅ **Check**: `.env` file exists in `backend/` folder
- ✅ **Check**: No spaces around the `=` sign
- ✅ **Check**: API key is correct (starts with `AIzaSy`)

#### **3. "HTTP 400 Bad Request" Error**
- ✅ **Check**: API key is valid and not expired
- ✅ **Check**: You have Gemini API access enabled

#### **4. "HTTP 403 Forbidden" Error**
- ✅ **Check**: API key has proper permissions
- ✅ **Check**: Billing is enabled (if required)

#### **5. Smart Replies Not Appearing**
- ✅ **Check**: Backend server is running
- ✅ **Check**: No console errors in browser
- ✅ **Check**: You're logged in (JWT token required)

---

## 💰 **Gemini API Pricing**

### **Free Tier:**
- ✅ **60 requests per minute**
- ✅ **1,500 requests per day**
- ✅ **Perfect for development and testing**

### **Paid Tier:**
- 💰 **$0.00025 per 1K characters** (input)
- 💰 **$0.0005 per 1K characters** (output)
- 💰 **Very affordable for production use**

---

## 🚀 **Expected Results**

### **When Working Correctly:**
- ✅ **Smart replies appear** after receiving messages
- ✅ **Sentiment analysis** works in test panel
- ✅ **Translation** works for different languages
- ✅ **No API errors** in server console
- ✅ **Fast responses** (usually < 2 seconds)

### **Example Smart Replies:**
For message: "How are you doing today?"
- "I'm doing great, thanks!"
- "Pretty good, how about you?"
- "All good here!"

---

## 📝 **Complete .env Example**

```bash
# Database
MONGODB_URI=mongodb://localhost:27017/messenger_chat

# JWT
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRED=7d
JWT_COOKIE_EXPIRES_IN=7

# Server
PORT=9000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# 🤖 AI Configuration
GEMINI_API_KEY=AIzaSyC_your_actual_api_key_here

# Email (Optional)
MAILTRAP_HOST=sandbox.smtp.mailtrap.io
MAILTRAP_PORT=2525
MAILTRAP_USER=your_mailtrap_username
MAILTRAP_PASS=your_mailtrap_password

# Cloudinary (Optional)
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

---

## 🎯 **Quick Setup Checklist**

- [ ] Get Gemini API key from Google AI Studio
- [ ] Add `GEMINI_API_KEY=your_key` to `backend/.env`
- [ ] Restart backend server
- [ ] Test smart replies in chat
- [ ] Use test panel (🧪) to verify all AI features
- [ ] Check for no API warnings in server console

**🎉 Once setup, your AI features will work perfectly!**