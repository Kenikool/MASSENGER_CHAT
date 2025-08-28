# Repository Tour

## 🎯 What This Repository Does

MASSANGER CHAT is a full-stack real-time messaging application built with the MERN stack (MongoDB, Express.js, React, Node.js) that provides secure, feature-rich communication with gamification elements.

**Key responsibilities:**
- Real-time messaging with Socket.IO for instant communication
- User authentication with 2FA, magic link login, and email verification
- Gamification system with badges, achievements, and user statistics
- File sharing and media upload capabilities with Cloudinary integration

---

## 🏗️ Architecture Overview

### System Context
```
[React Client] ↔ [Express.js API Server] ↔ [MongoDB Database]
      ↕                    ↕                      ↕
[Socket.IO Client] ↔ [Socket.IO Server]    [Cloudinary CDN]
      ↕                    ↕
[Real-time Events]   [Email Service (Mailtrap)]
```

### Key Components
- **Frontend (React + Vite)** - Modern SPA with Zustand state management, TailwindCSS styling, and real-time UI updates
- **Backend (Express.js)** - RESTful API server with Socket.IO integration for real-time features
- **Database (MongoDB)** - Document-based storage for users, messages, and gamification data
- **Real-time Engine (Socket.IO)** - Bidirectional communication for instant messaging, typing indicators, and online status
- **Authentication System** - JWT-based auth with 2FA, magic links, and session management
- **Gamification Engine** - Badge system, user statistics, and achievement tracking

### Data Flow
1. **User Authentication**: Client authenticates via JWT tokens stored in HTTP-only cookies
2. **Real-time Connection**: Socket.IO establishes persistent connection for live features
3. **Message Flow**: Messages sent via Socket.IO, stored in MongoDB, and broadcast to recipients
4. **File Uploads**: Media files uploaded to Cloudinary, URLs stored in message documents
5. **Gamification**: User actions trigger badge calculations and statistics updates

---

## 📁 Project Structure [Partial Directory Tree]

```
MASSENGERS_CHAT/
├── backend/                    # Node.js/Express.js server
│   ├── config/                # Database and service configurations
│   ├── controllers/           # Route handlers and business logic
│   ├── lib/                   # Core utilities (socket.io, email service)
│   ├── middleware/            # Authentication and request processing
│   ├── models/                # MongoDB schemas (User, Message, etc.)
│   ├── routes/                # API route definitions
│   ├── utils/                 # Helper functions and utilities
│   └── server.js              # Main server entry point
├── client/                    # React frontend application
│   ├── src/
│   │   ├── components/        # Reusable React components
│   │   ├── pages/             # Route-based page components
│   │   ├── store/             # Zustand state management
│   │   ├── context/           # React context providers
│   │   ├── hooks/             # Custom React hooks
│   │   └── lib/               # Frontend utilities and API client
│   ├── public/                # Static assets
│   └── package.json           # Frontend dependencies
├── uploads/                   # Local file storage (development)
├── package.json               # Root package.json for backend
└── README.md                  # Project documentation
```

### Key Files to Know

| File | Purpose | When You'd Touch It |
|------|---------|---------------------|
| `backend/server.js` | Main server entry point | Adding new middleware or global configs |
| `backend/lib/socket.js` | Socket.IO server setup | Modifying real-time features |
| `backend/models/user.model.js` | User data schema | Adding new user fields or validation |
| `backend/models/message.model.js` | Message data schema | Changing message structure |
| `client/src/App.jsx` | Main React app component | Adding new routes or global features |
| `client/src/store/useAuthStore.js` | Authentication state management | Modifying auth logic |
| `client/src/store/useChatStore.js` | Chat state management | Changing message handling |
| `backend/routes/auth.route.js` | Authentication API routes | Adding new auth endpoints |
| `backend/routes/message.route.js` | Messaging API routes | Modifying message operations |
| `package.json` | Backend dependencies | Adding new server-side packages |

---

## 🔧 Technology Stack

### Core Technologies
- **Language:** JavaScript (ES6+) - Modern JavaScript with module syntax
- **Frontend Framework:** React 19.1.1 with Vite - Fast development and optimized builds
- **Backend Framework:** Express.js 5.1.0 - RESTful API server with middleware support
- **Database:** MongoDB with Mongoose 8.18.0 - Document-based NoSQL database
- **Real-time:** Socket.IO 4.8.1 - Bidirectional real-time communication

### Key Libraries
- **State Management:** Zustand 5.0.8 - Lightweight state management for React
- **Styling:** TailwindCSS 4.1.12 + DaisyUI 5.0.50 - Utility-first CSS with component library
- **Authentication:** JWT + bcryptjs + speakeasy - Secure token-based auth with 2FA
- **File Upload:** Multer + Cloudinary - File handling and cloud storage
- **Email Service:** Mailtrap + Nodemailer - Email verification and notifications
- **UI Components:** Lucide React + React Icons - Icon libraries for modern UI

### Development Tools
- **Build Tool:** Vite 7.1.2 - Fast development server and build tool
- **Process Manager:** Nodemon 3.1.10 - Auto-restart server during development
- **Linting:** ESLint 9.33.0 - Code quality and consistency
- **HTTP Client:** Axios 1.11.0 - Promise-based HTTP requests

---

## 🌐 External Dependencies

### Required Services
- **MongoDB Database** - Primary data storage for users, messages, and application data
- **Cloudinary CDN** - Image and file storage service for media uploads
- **Mailtrap SMTP** - Email service for verification emails and notifications (development)

### Optional Integrations
- **Email Service** - Can be configured with any SMTP provider for production
- **File Storage** - Local uploads folder available as fallback for development

### Environment Variables

```bash
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/messenger_chat

# JWT Configuration  
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRED=7d
JWT_COOKIE_EXPIRES_IN=7

# Frontend Configuration
FRONTEND_URL=http://localhost:5173
LOGIN_SUCCESS_REDIRECT=/

# Email Service (Mailtrap for development)
MAILTRAP_HOST=sandbox.smtp.mailtrap.io
MAILTRAP_PORT=2525
MAILTRAP_USER=your_mailtrap_username
MAILTRAP_PASS=your_mailtrap_password

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Server Configuration
PORT=9000
NODE_ENV=development
```

---

## 🔄 Common Workflows

### User Registration & Authentication
1. User submits registration form with email/password
2. Backend creates user account and sends verification email
3. User clicks verification link to activate account
4. Login with credentials or magic link option available
5. JWT token stored in HTTP-only cookie for session management

**Code path:** `SignUpPage.jsx` → `auth.controller.js` → `User.model.js` → `emailService.js`

### Real-time Messaging
1. User selects contact from sidebar
2. Socket.IO establishes connection with user ID
3. Messages sent via socket events, stored in MongoDB
4. Real-time delivery to online recipients
5. Typing indicators and read receipts handled via socket events

**Code path:** `ChatContainer.jsx` → `socket.js` → `message.controller.js` → `Message.model.js`

### Gamification System
1. User actions (messages sent, login streaks) trigger badge calculations
2. Backend evaluates achievement criteria and awards badges
3. New badges trigger real-time notifications
4. User statistics updated and displayed on profile
5. Public profiles show earned badges and achievements

**Code path:** `gamification.controller.js` → `User.model.js` → `ProfilePage.jsx`

---

## 📈 Performance & Scale

### Performance Considerations
- **Socket.IO Connection Management:** Efficient user mapping and connection cleanup
- **Database Indexing:** Optimized queries for messages and user lookups
- **File Upload Optimization:** Cloudinary integration for scalable media storage
- **State Management:** Zustand for minimal re-renders and efficient updates

### Monitoring
- **Real-time Metrics:** Socket connection counts and message throughput
- **Database Performance:** MongoDB query performance and connection pooling
- **Error Tracking:** Comprehensive error handling and logging throughout the stack

---

## 🚨 Things to Be Careful About

### 🔒 Security Considerations
- **Authentication:** JWT tokens in HTTP-only cookies prevent XSS attacks
- **2FA Implementation:** TOTP-based two-factor authentication with QR codes
- **Input Validation:** DOMPurify for message sanitization and XSS prevention
- **Session Management:** Multiple session tracking with device information
- **Password Security:** bcryptjs hashing with salt rounds for secure storage

### ⚠️ Development Notes
- **Socket.IO CORS:** Ensure proper origin configuration for production deployment
- **Environment Variables:** All sensitive data must be properly configured in .env files
- **Database Connections:** MongoDB connection string must be accessible from server
- **File Upload Limits:** Multer configured with 50MB limit for media files
- **Magic Link Security:** Tokens expire after limited time and single use

*Updated at: 2025-01-27 UTC*
*Last commit: 3ad1bea - 2fa, email, award, leaderboard e.t.c*