import express from "express";
import { protectedRoute } from "../middleware/auth.middleware.js";
import aiService from "../services/aiService.js";

const router = express.Router();

// Health check endpoint (no auth required)
router.get("/health", (req, res) => {
  res.json({ 
    status: "AI routes are working", 
    timestamp: new Date().toISOString(),
    geminiConfigured: !!process.env.GEMINI_API_KEY
  });
});

// Smart replies endpoint
router.post("/smart-replies", protectedRoute, async (req, res) => {
  try {
    const { message, context = [] } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const suggestions = await aiService.generateSmartReplies(message, context);

    res.json({ suggestions });
  } catch (error) {
    console.error("Error generating smart replies:", error);
    res.status(500).json({ error: "Failed to generate suggestions" });
  }
});

// Sentiment analysis endpoint
router.post("/sentiment", protectedRoute, async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: "Text is required" });
    }

    const sentiment = await aiService.analyzeSentiment(text);

    res.json({ sentiment });
  } catch (error) {
    console.error("Error analyzing sentiment:", error);
    res.status(500).json({ error: "Failed to analyze sentiment" });
  }
});

// Translation endpoint
router.post("/translate", protectedRoute, async (req, res) => {
  try {
    const { text, targetLang = "es" } = req.body;

    if (!text) {
      return res.status(400).json({ error: "Text is required" });
    }

    const translation = await aiService.translateMessage(text, targetLang);

    res.json({ translation });
  } catch (error) {
    console.error("Error translating message:", error);
    res.status(500).json({ error: "Failed to translate message" });
  }
});

// Conversation summary endpoint
router.post("/summarize", protectedRoute, async (req, res) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Messages array is required" });
    }

    const summary = await aiService.summarizeConversation(messages);

    res.json({ summary });
  } catch (error) {
    console.error("Error summarizing conversation:", error);
    res.status(500).json({ error: "Failed to summarize conversation" });
  }
});

// Spam detection endpoint
router.post("/detect-spam", protectedRoute, async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: "Text is required" });
    }

    const spamResult = await aiService.detectSpam(text);

    res.json({ spamResult });
  } catch (error) {
    console.error("Error detecting spam:", error);
    res.status(500).json({ error: "Failed to detect spam" });
  }
});

// Auto-complete endpoint
router.post("/autocomplete", protectedRoute, async (req, res) => {
  try {
    const { partialText } = req.body;

    if (!partialText) {
      return res.status(400).json({ error: "Partial text is required" });
    }

    const completions = await aiService.getAutoComplete(partialText);

    res.json({ completions });
  } catch (error) {
    console.error("Error getting auto-complete:", error);
    res.status(500).json({ error: "Failed to get completions" });
  }
});

// Content moderation endpoint
router.post("/moderate", protectedRoute, async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: "Text is required" });
    }

    const moderation = await aiService.moderateContent(text);

    res.json({ moderation });
  } catch (error) {
    console.error("Error moderating content:", error);
    res.status(500).json({ error: "Failed to moderate content" });
  }
});

export default router;
