// routes/message.routes.js
import express from "express";
import { protectedRoute } from "../middleware/auth.middleware.js"; // ✅ Assuming this is the name
import { uploadImage } from "../controllers/upload.controller.js";
import { uploadVoice } from "../controllers/voice.controller.js";
import multer from "multer";

import {
  getUserForSidebar,
  getMessages,
  getGroupMessages,
  sendMessage,
  markMessagesAsRead,
  editMessage,
  deleteMessage,
  getThreadReplies,
  searchMessages,
} from "../controllers/message.controller.js";
import { awardCollaboratorBadge } from "../controllers/gamification.controller.js";

const upload = multer({ dest: "uploads/" });
const router = express.Router();

// Debug endpoint to test message sending
router.post("/debug-send", protectedRoute, (req, res) => {
  res.json({
    message: "Debug endpoint working",
    body: req.body,
    params: req.params,
    user: req.user._id.toString(),
    timestamp: new Date().toISOString()
  });
});

// Comprehensive debug endpoint
router.get("/debug-info", protectedRoute, async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Get recent messages
    const recentMessages = await Message.find({
      $or: [
        { senderId: userId },
        { receiverId: userId }
      ]
    })
    .sort({ createdAt: -1 })
    .limit(5)
    .populate('senderId', 'fullName')
    .populate('receiverId', 'fullName');
    
    // Get user's groups
    const Group = (await import('../models/group.model.js')).default;
    const userGroups = await Group.find({
      'members.userId': userId
    }).select('name members');
    
    res.json({
      user: {
        id: userId.toString(),
        name: req.user.fullName
      },
      recentMessages: recentMessages.map(msg => ({
        id: msg._id.toString(),
        text: msg.text,
        sender: msg.senderId.fullName,
        receiver: msg.receiverId?.fullName,
        groupId: msg.groupId?.toString(),
        reactions: msg.reactions,
        createdAt: msg.createdAt
      })),
      groups: userGroups.map(group => ({
        id: group._id.toString(),
        name: group.name,
        memberCount: group.members.length
      })),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/users", protectedRoute, getUserForSidebar);
router.get("/:id", protectedRoute, getMessages);
router.get("/group/:groupId", protectedRoute, getGroupMessages);
router.post("/send/:id", protectedRoute, sendMessage);
router.post("/send-group", protectedRoute, sendMessage); // For group messages without receiverId
router.put("/markAsRead/:id", protectedRoute, markMessagesAsRead);
router.put("/:id", protectedRoute, editMessage);
router.delete("/:id", protectedRoute, deleteMessage);

// ✅ Your upload route
router.post(
  "/upload",
  protectedRoute,
  upload.single("image"),
  uploadImage,
  awardCollaboratorBadge
);

// ✅ Voice upload route
router.post(
  "/upload-voice",
  protectedRoute,
  upload.single("voice"),
  uploadVoice, // Use the dedicated voice upload controller
  awardCollaboratorBadge
);

// ✅ Threading routes
router.get("/thread/:id", protectedRoute, getThreadReplies);

// ✅ Search routes
router.post("/search", protectedRoute, searchMessages);

// Test formatting endpoint
router.post("/test-formatting", protectedRoute, async (req, res) => {
  try {
    const { text } = req.body;
    const { formatMessage, hasFormattingMarkers, getFormattingInfo } = await import('../utils/messageFormatter.js');
    
    if (!text) {
      return res.status(400).json({ error: "Text is required" });
    }
    
    const formattingInfo = getFormattingInfo(text);
    const htmlFormatted = formatMessage(text, { outputFormat: 'html' });
    
    res.json({
      originalText: text,
      hasFormatting: formattingInfo.hasFormatting,
      formattingTypes: formattingInfo.types,
      plainText: formattingInfo.plainText,
      htmlFormatted: htmlFormatted,
      formattedHtml: formattingInfo.formattedHtml,
      examples: {
        bold: "**bold text** or __bold text__",
        italic: "*italic text* or _italic text_",
        strikethrough: "~~strikethrough text~~",
        code: "`code text`",
        codeblock: "```\ncode block\n```",
        underline: "<u>underlined text</u>"
      }
    });
  } catch (error) {
    console.error('Error testing formatting:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
