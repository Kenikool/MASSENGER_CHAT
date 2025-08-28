# Setup Instructions for Messenger Chat Application

## Environment Variables Setup

Create a `.env` file in the backend directory with the following variables:

```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/messenger_chat

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random_at_least_32_characters
JWT_EXPIRED=7d
JWT_COOKIE_EXPIRES_IN=7

# Frontend URLs
FRONTEND_URL=http://localhost:5173
LOGIN_SUCCESS_REDIRECT=/

# Email Configuration (Mailtrap for development)
MAILTRAP_HOST=sandbox.smtp.mailtrap.io
MAILTRAP_PORT=2525
MAILTRAP_USER=your_mailtrap_username
MAILTRAP_PASS=your_mailtrap_password

# Cloudinary Configuration (for image uploads)
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Server Configuration
PORT=9000
NODE_ENV=development
```

## Issues Fixed

### 1. Magic Login 404 Error

- **Problem**: The magic login flow was redirecting from frontend to backend, then backend back to frontend, causing a redirect loop
- **Solution**: Changed the flow to use API calls instead of redirects, with proper error handling

### 2. Missing Environment Variables

- **Problem**: No `.env` file found, causing undefined environment variables
- **Solution**: Added fallback values for all critical environment variables

### 3. CORS Configuration

- **Problem**: Limited CORS origins
- **Solution**: Expanded CORS configuration to include more localhost variations

### 4. Error Handling

- **Problem**: Missing error handling in several areas
- **Solution**: Added comprehensive error handling and fallbacks

## How to Run

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create the `.env` file in the backend directory with the variables above

3. Start the backend server:

   ```bash
   npm start
   ```

4. Start the frontend (in a separate terminal):
   ```bash
   cd client
   npm install
   npm run dev
   ```

## Magic Login Flow (Fixed)

1. User clicks "Login with Magic Link" on login page
2. Backend sends email with magic link
3. User clicks magic link in email
4. Frontend MagicLoginPage component makes API call to backend
5. Backend verifies token and sets authentication cookie
6. Frontend receives success response and redirects to home page

The 404 error should now be resolved!
