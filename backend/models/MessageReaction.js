import mongoose from "mongoose";

const messageReactionSchema = new mongoose.Schema({
  messageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Message",
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  emoji: {
    type: String,
    required: true,
    enum: [
      // Popular
      '❤️', '👍', '👎', '😂', '😮', '😢', '😡', '🔥',
      // Emotions
      '😍', '🤔', '😴', '🤯', '🥳',
      // Approval
      '💯', '👏', '🙌', '💪', '✨',
      // Celebration
      '🎉', '🎊', '🏆', '⭐', '💫', '🌟', '🎈',
      // Objects
      '💖', '💝', '🎁', '🌹', '☕', '🍕', '🎵', '📱'
    ]
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Compound index to prevent duplicate reactions
messageReactionSchema.index({ messageId: 1, userId: 1, emoji: 1 }, { unique: true });

const MessageReaction = mongoose.model("MessageReaction", messageReactionSchema);
export default MessageReaction;