import { Server } from "socket.io";
import http from "http";
import express from "express";
import User from "../models/user.model.js";
import Message from "../models/message.model.js"; // Import Message model

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:3000",
      "http://127.0.0.1:5173",
      "http://127.0.0.1:5174",
    ],
    credentials: true,
  },
});

export function getReceiverSocketId(userId) {
  const socketId = userSocketMap[userId];
  console.log(`🔍 getReceiverSocketId for ${userId}:`, socketId || 'NOT_FOUND');
  return socketId;
}

// used to store online users
const userSocketMap = {}; // {userId: socketId}

io.on("connection", (socket) => {
  console.log("A user connected", socket.id);

  const userId = socket.handshake.query.userId;
  console.log("User ID from handshake:", userId);
  
  if (userId && userId !== 'undefined') {
    userSocketMap[userId] = socket.id;
    console.log("User added to socket map:", userId, socket.id);
    console.log('🗺️ Current socket map:', Object.keys(userSocketMap));
    
    // Update user's online status in database
    User.findByIdAndUpdate(userId, { 
      lastSeen: new Date(),
      isOnline: true 
    }).catch(err => console.error("Error updating user online status:", err));
  } else {
    console.warn("Invalid or missing userId in handshake:", userId);
  }

  // io.emit() is used to send events to all the connected clients
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  // Handle joining group rooms
  socket.on("joinGroup", (groupId) => {
    socket.join(`group_${groupId}`);
    console.log(`💬 User ${userId} joined group room: group_${groupId}`);
    
    // Emit confirmation back to the user
    socket.emit("groupJoined", {
      groupId,
      message: `Successfully joined group ${groupId}`
    });
  });

  // Handle leaving group rooms
  socket.on("leaveGroup", (groupId) => {
    socket.leave(`group_${groupId}`);
    console.log(`💬 User ${userId} left group room: group_${groupId}`);
    
    // Emit confirmation back to the user
    socket.emit("groupLeft", {
      groupId,
      message: `Successfully left group ${groupId}`
    });
  });
  
  // Debug: Show current rooms for this socket
  socket.on("getRooms", () => {
    const rooms = Array.from(socket.rooms);
    console.log(`🗺️ User ${userId} is in rooms:`, rooms);
    socket.emit("currentRooms", rooms);
  });
  
  // Test socket connection
  socket.on("testConnection", (data) => {
    console.log(`🧪 Test connection from user ${userId}:`, data);
    socket.emit("testConnectionResponse", {
      message: "Connection test successful",
      userId,
      timestamp: new Date().toISOString(),
      originalData: data
    });
  });

  // Socket.IO for typing indicators
  socket.on("typing", ({ receiverId, senderId }) => {
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("typing", senderId);
    }
  });

  socket.on("stopTyping", ({ receiverId, senderId }) => {
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("stopTyping", senderId);
    }
  });

  socket.on("messageDelivered", async ({ messageId, receiverId, senderId }) => {
    try {
      await Message.findByIdAndUpdate(messageId, { status: "delivered" });

      // Emit to the sender that their message has been delivered
      const senderSocketId = getReceiverSocketId(senderId);
      if (senderSocketId) {
        io.to(senderSocketId).emit("messageDelivered", {
          messageId,
          receiverId,
        });
      }
    } catch (error) {
      console.error("Error marking message as delivered:", error);
    }
  });

  socket.on("disconnect", async () => {
    console.log("A user disconnected", socket.id);
    
    // Get userId from the socket map or handshake query
    const disconnectedUserId = userId || Object.keys(userSocketMap).find(key => userSocketMap[key] === socket.id);
    
    if (disconnectedUserId) {
      delete userSocketMap[disconnectedUserId];
      
      // ✅ Update the user's lastSeen timestamp and offline status in the database
      try {
        await User.findByIdAndUpdate(disconnectedUserId, { 
          lastSeen: new Date(),
          isOnline: false 
        });
        console.log(`User ${disconnectedUserId} marked as offline`);
      } catch (error) {
        console.error("Error updating user lastSeen:", error);
      }
    }

    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

export { io, app, server };
