import Message from "../models/message.model.js";
import MessageReaction from "../models/MessageReaction.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

export const addReaction = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;
    const userId = req.user._id;

    console.log('🎭 AddReaction Debug:', {
      messageId,
      emoji,
      userId: userId.toString(),
      timestamp: new Date().toISOString()
    });

    // Enhanced emoji validation - support all categories
    const validEmojis = [
      // Popular
      '❤️', '👍', '👎', '😂', '😮', '😢', '😡', '🔥',
      // Emotions
      '😂', '😢', '😡', '😍', '🤔', '😴', '🤯', '🥳',
      // Approval
      '👍', '👎', '💯', '🔥', '👏', '🙌', '💪', '✨',
      // Celebration
      '🎉', '🥳', '🎊', '🏆', '⭐', '💫', '🌟', '🎈',
      // Objects
      '💖', '💝', '🎁', '🌹', '☕', '🍕', '🎵', '📱'
    ];
    
    if (!validEmojis.includes(emoji)) {
      console.log('❌ Invalid emoji:', emoji);
      return res.status(400).json({ error: "Invalid emoji" });
    }

    console.log('✅ Emoji validation passed');

    const message = await Message.findById(messageId);
    if (!message) {
      console.log('❌ Message not found:', messageId);
      return res.status(404).json({ error: "Message not found" });
    }

    console.log('✅ Message found:', {
      messageId: message._id.toString(),
      senderId: message.senderId.toString(),
      receiverId: message.receiverId?.toString(),
      groupId: message.groupId?.toString(),
      currentReactions: message.reactions.length
    });

    // Check if user already reacted with this emoji
    const existingReaction = await MessageReaction.findOne({
      messageId,
      userId,
      emoji,
    });

    if (existingReaction) {
      console.log('🔄 Removing existing reaction');
      // Remove reaction
      await MessageReaction.deleteOne({ _id: existingReaction._id });
      
      // Update message reactions array
      const reactionIndex = message.reactions.findIndex(r => r.emoji === emoji);
      if (reactionIndex > -1) {
        message.reactions[reactionIndex].users = message.reactions[reactionIndex].users.filter(
          id => !id.equals(userId)
        );
        message.reactions[reactionIndex].count = message.reactions[reactionIndex].users.length;
        
        // Remove reaction if no users left
        if (message.reactions[reactionIndex].count === 0) {
          message.reactions.splice(reactionIndex, 1);
        }
      }
      console.log('✅ Reaction removed successfully');
    } else {
      console.log('➕ Adding new reaction');
      // Add reaction
      const newReaction = await MessageReaction.create({
        messageId,
        userId,
        emoji,
      });
      console.log('✅ MessageReaction created:', newReaction._id.toString());

      // Update message reactions array
      const existingReactionIndex = message.reactions.findIndex(r => r.emoji === emoji);
      if (existingReactionIndex > -1) {
        message.reactions[existingReactionIndex].users.push(userId);
        message.reactions[existingReactionIndex].count = message.reactions[existingReactionIndex].users.length;
        console.log('✅ Updated existing reaction group');
      } else {
        message.reactions.push({
          emoji,
          users: [userId],
          count: 1,
        });
        console.log('✅ Created new reaction group');
      }
    }

    const savedMessage = await message.save();
    console.log('✅ Message saved with reactions:', savedMessage.reactions.length);

    // Emit socket event for real-time updates
    try {
      console.log('📡 Attempting to emit socket events...');
      
      if (message.groupId) {
        // For group messages, emit to the group room
        console.log(`📡 Emitting to group room: group_${message.groupId}`);
        io.to(`group_${message.groupId}`).emit('messageReaction', {
          messageId,
          reactions: message.reactions,
        });
        console.log(`✅ Emitted reaction to group ${message.groupId}`);
      } else {
        // For direct messages, emit to both sender and receiver
        const receiverSocketId = getReceiverSocketId(message.receiverId.toString());
        const senderSocketId = getReceiverSocketId(message.senderId.toString());
        
        console.log('📡 Socket IDs:', {
          receiverSocketId,
          senderSocketId,
          receiverId: message.receiverId.toString(),
          senderId: message.senderId.toString()
        });
        
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('messageReaction', {
            messageId,
            reactions: message.reactions,
          });
          console.log('✅ Emitted to receiver');
        } else {
          console.log('⚠️ No receiver socket found');
        }
        
        if (senderSocketId) {
          io.to(senderSocketId).emit('messageReaction', {
            messageId,
            reactions: message.reactions,
          });
          console.log('✅ Emitted to sender');
        } else {
          console.log('⚠️ No sender socket found');
        }
        
        console.log(`✅ Completed emission for sender ${message.senderId} and receiver ${message.receiverId}`);
      }
    } catch (socketError) {
      console.error('❌ Error emitting reaction socket event:', socketError);
    }

    res.status(200).json({ 
      success: true,
      reactions: message.reactions 
    });
  } catch (error) {
    console.error('❌ Error in addReaction:', {
      error: error.message,
      stack: error.stack,
      messageId,
      emoji,
      userId: userId?.toString()
    });
    
    // Send detailed error for debugging
    res.status(500).json({ 
      error: "Internal server error",
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

export const getMessageReactions = async (req, res) => {
  try {
    const { messageId } = req.params;
    
    const reactions = await MessageReaction.find({ messageId })
      .populate('userId', 'fullName profilePic')
      .sort({ createdAt: -1 });

    const groupedReactions = {};
    reactions.forEach(reaction => {
      if (!groupedReactions[reaction.emoji]) {
        groupedReactions[reaction.emoji] = [];
      }
      groupedReactions[reaction.emoji].push({
        user: reaction.userId,
        createdAt: reaction.createdAt,
      });
    });

    res.status(200).json({ reactions: groupedReactions });
  } catch (error) {
    console.error("Error in getMessageReactions:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};