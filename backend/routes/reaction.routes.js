import express from "express";
import { protectedRoute } from "../middleware/auth.middleware.js";
import {
  addReaction,
  getMessageReactions,
} from "../controllers/reaction.controller.js";
import Message from "../models/message.model.js";
import MessageReaction from "../models/MessageReaction.js";

const router = express.Router();

// Test endpoint
router.get("/test", (req, res) => {
  res.json({ 
    message: "Reaction routes are working", 
    timestamp: new Date().toISOString() 
  });
});

// Test reaction without validation
router.post("/test-simple-reaction", protectedRoute, async (req, res) => {
  try {
    const { messageId } = req.body;
    const userId = req.user._id;
    const emoji = '❤️'; // Fixed emoji
    
    console.log('🧪 Simple reaction test:', { messageId, userId: userId.toString(), emoji });
    
    // Check if message exists
    const message = await Message.findById(messageId);
    if (!message) {
      console.log('❌ Message not found:', messageId);
      return res.status(404).json({ error: "Message not found" });
    }
    
    console.log('✅ Message found:', {
      id: message._id.toString(),
      text: message.text?.substring(0, 30),
      senderId: message.senderId.toString(),
      currentReactions: message.reactions.length
    });
    
    // Check if reaction already exists
    const existingReaction = await MessageReaction.findOne({
      messageId,
      userId,
      emoji
    });
    
    if (existingReaction) {
      console.log('⚠️ Reaction already exists, removing it');
      await MessageReaction.deleteOne({ _id: existingReaction._id });
      return res.json({ success: true, action: 'removed', message: 'Reaction removed' });
    }
    
    // Create new reaction
    console.log('➕ Creating new reaction...');
    const reaction = await MessageReaction.create({
      messageId,
      userId,
      emoji
    });
    
    console.log('✅ Reaction created successfully:', reaction._id.toString());
    
    // Update message reactions array
    const existingReactionIndex = message.reactions.findIndex(r => r.emoji === emoji);
    if (existingReactionIndex > -1) {
      message.reactions[existingReactionIndex].users.push(userId);
      message.reactions[existingReactionIndex].count = message.reactions[existingReactionIndex].users.length;
    } else {
      message.reactions.push({
        emoji,
        users: [userId],
        count: 1
      });
    }
    
    await message.save();
    console.log('✅ Message updated with reaction');
    
    res.json({
      success: true,
      action: 'added',
      reaction: reaction,
      message: "Simple reaction test successful",
      messageReactions: message.reactions
    });
  } catch (error) {
    console.error('❌ Simple reaction test failed:', error);
    res.status(500).json({ 
      error: error.message,
      name: error.name,
      details: error.stack
    });
  }
});

// Test endpoint to find messages
router.get("/test-messages", protectedRoute, async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Find recent messages
    const messages = await Message.find({
      $or: [
        { senderId: userId },
        { receiverId: userId }
      ]
    })
    .sort({ createdAt: -1 })
    .limit(5)
    .select('_id text senderId receiverId groupId createdAt reactions');
    
    console.log(`📝 Found ${messages.length} messages for user ${userId}`);
    
    res.json({
      success: true,
      messageCount: messages.length,
      messages: messages.map(msg => ({
        id: msg._id.toString(),
        text: msg.text?.substring(0, 50) + '...',
        senderId: msg.senderId.toString(),
        receiverId: msg.receiverId?.toString(),
        groupId: msg.groupId?.toString(),
        reactions: msg.reactions,
        createdAt: msg.createdAt
      })),
      userId: userId.toString()
    });
  } catch (error) {
    console.error('❌ Error finding messages:', error);
    res.status(500).json({ error: error.message });
  }
});

// Test socket emission
router.post("/test-socket", protectedRoute, async (req, res) => {
  try {
    const { getReceiverSocketId, io } = await import('../lib/socket.js');
    const userId = req.user._id.toString();
    
    console.log('📡 Testing socket emission for user:', userId);
    
    const socketId = getReceiverSocketId(userId);
    console.log('🔍 Socket ID found:', socketId);
    
    if (socketId) {
      io.to(socketId).emit('testMessage', {
        message: 'Test socket emission successful',
        timestamp: new Date().toISOString(),
        userId
      });
      console.log('✅ Test message emitted');
      
      res.json({
        success: true,
        message: 'Test socket message sent',
        socketId,
        userId
      });
    } else {
      res.json({
        success: false,
        message: 'No socket connection found for user',
        userId
      });
    }
  } catch (error) {
    console.error('❌ Socket test failed:', error);
    res.status(500).json({ error: error.message });
  }
});

// Debug endpoint to check message reactions
router.get("/debug/:messageId", protectedRoute, async (req, res) => {
  try {
    const { messageId } = req.params;
    
    const message = await Message.findById(messageId);
    const reactions = await MessageReaction.find({ messageId });
    
    res.json({
      message: {
        id: message?._id,
        reactions: message?.reactions || [],
        reactionCount: message?.reactions?.length || 0
      },
      separateReactions: reactions,
      separateReactionCount: reactions.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Simple test reaction endpoint
router.post("/test-reaction", protectedRoute, async (req, res) => {
  try {
    const { messageId, emoji } = req.body;
    const userId = req.user._id;
    
    console.log('🧪 Test reaction request:', { messageId, emoji, userId: userId.toString() });
    
    // Check if message exists
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }
    
    console.log('✅ Message found for reaction test');
    
    // Try to create a reaction directly
    const reaction = await MessageReaction.create({
      messageId,
      userId,
      emoji: emoji || '❤️'
    });
    
    console.log('✅ Test reaction created:', reaction._id.toString());
    
    res.json({
      success: true,
      reaction: reaction,
      message: "Test reaction created successfully"
    });
  } catch (error) {
    console.error('❌ Test reaction failed:', error);
    
    // Check if it's a validation error
    if (error.name === 'ValidationError') {
      console.error('❌ Validation Error Details:', error.errors);
      return res.status(400).json({ 
        error: "Validation failed",
        details: error.errors,
        message: error.message
      });
    }
    
    res.status(500).json({ 
      error: error.message,
      details: error.stack,
      name: error.name
    });
  }
});

router.post("/:messageId", protectedRoute, addReaction);
router.get("/:messageId", protectedRoute, getMessageReactions);

export default router;
