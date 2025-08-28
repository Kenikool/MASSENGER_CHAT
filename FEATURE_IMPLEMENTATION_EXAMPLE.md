# 🚀 Feature Implementation Example: Message Reactions

## 1. **Backend Implementation**

### Update Message Model
```javascript
// backend/models/message.model.js - Add reactions field
const messageSchema = new mongoose.Schema({
  // ... existing fields
  reactions: [{
    emoji: { type: String, required: true }, // 👍, ❤️, 😂, etc.
    users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    count: { type: Number, default: 0 }
  }],
  // ... rest of schema
});
```

### Add Reaction Controller
```javascript
// backend/controllers/message.controller.js - Add these functions

export const addReaction = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    // Find existing reaction for this emoji
    const existingReaction = message.reactions.find(r => r.emoji === emoji);

    if (existingReaction) {
      // Check if user already reacted with this emoji
      if (existingReaction.users.includes(userId)) {
        // Remove reaction
        existingReaction.users = existingReaction.users.filter(
          id => !id.equals(userId)
        );
        existingReaction.count = existingReaction.users.length;
        
        // Remove reaction if no users left
        if (existingReaction.count === 0) {
          message.reactions = message.reactions.filter(r => r.emoji !== emoji);
        }
      } else {
        // Add user to existing reaction
        existingReaction.users.push(userId);
        existingReaction.count = existingReaction.users.length;
      }
    } else {
      // Create new reaction
      message.reactions.push({
        emoji,
        users: [userId],
        count: 1
      });
    }

    await message.save();

    // Emit socket event for real-time updates
    const io = req.app.get('io');
    io.to(message.receiverId.toString()).emit('messageReaction', {
      messageId,
      reactions: message.reactions
    });

    res.status(200).json({ reactions: message.reactions });
  } catch (error) {
    console.error("Error in addReaction:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMessageReactions = async (req, res) => {
  try {
    const { messageId } = req.params;
    
    const message = await Message.findById(messageId)
      .populate('reactions.users', 'fullName profilePic')
      .select('reactions');
    
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    res.status(200).json({ reactions: message.reactions });
  } catch (error) {
    console.error("Error in getMessageReactions:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
```

### Add Routes
```javascript
// backend/routes/message.route.js - Add these routes
router.post("/:messageId/reactions", protectedRoute, addReaction);
router.get("/:messageId/reactions", protectedRoute, getMessageReactions);
```

## 2. **Frontend Implementation**

### Create Reaction Component
```jsx
// client/src/components/MessageReactions.jsx
import React, { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import axiosInstance from '../lib/axios';
import { toast } from 'react-hot-toast';

const EMOJI_OPTIONS = ['👍', '❤️', '😂', '😮', '😢', '😡'];

const MessageReactions = ({ message, onReactionUpdate }) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const { authUser } = useAuthStore();

  const handleReaction = async (emoji) => {
    try {
      const response = await axiosInstance.post(
        `/messages/${message._id}/reactions`,
        { emoji }
      );
      
      onReactionUpdate(message._id, response.data.reactions);
      setShowEmojiPicker(false);
    } catch (error) {
      toast.error('Failed to add reaction');
    }
  };

  const hasUserReacted = (reaction) => {
    return reaction.users.some(user => user._id === authUser._id);
  };

  return (
    <div className="flex items-center gap-2 mt-1">
      {/* Existing Reactions */}
      {message.reactions?.map((reaction, index) => (
        <button
          key={index}
          onClick={() => handleReaction(reaction.emoji)}
          className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-colors ${
            hasUserReacted(reaction)
              ? 'bg-primary/20 text-primary border border-primary'
              : 'bg-base-200 hover:bg-base-300'
          }`}
        >
          <span>{reaction.emoji}</span>
          <span>{reaction.count}</span>
        </button>
      ))}

      {/* Add Reaction Button */}
      <div className="relative">
        <button
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="btn btn-ghost btn-xs btn-circle"
          title="Add reaction"
        >
          😊
        </button>

        {/* Emoji Picker */}
        {showEmojiPicker && (
          <div className="absolute bottom-full left-0 mb-2 p-2 bg-base-100 border border-base-300 rounded-lg shadow-lg flex gap-1 z-10">
            {EMOJI_OPTIONS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleReaction(emoji)}
                className="btn btn-ghost btn-xs hover:bg-base-200"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageReactions;
```

### Update Message Component
```jsx
// client/src/components/Message.jsx - Add reactions to message display
import MessageReactions from './MessageReactions';

const Message = ({ message, onReactionUpdate }) => {
  // ... existing message rendering code

  return (
    <div className={`chat ${isFromMe ? "chat-end" : "chat-start"}`}>
      {/* ... existing message content */}
      
      {/* Add reactions component */}
      <MessageReactions 
        message={message} 
        onReactionUpdate={onReactionUpdate}
      />
    </div>
  );
};
```

### Update Chat Store
```javascript
// client/src/store/useChatStore.js - Add reaction handling
const useChatStore = create((set, get) => ({
  // ... existing state

  updateMessageReactions: (messageId, reactions) => {
    set((state) => ({
      messages: state.messages.map(msg =>
        msg._id === messageId 
          ? { ...msg, reactions }
          : msg
      )
    }));
  },

  // ... rest of store
}));
```

### Update Socket Handling
```javascript
// client/src/hooks/useListenMessages.js - Add reaction listener
useEffect(() => {
  socket?.on("messageReaction", (data) => {
    updateMessageReactions(data.messageId, data.reactions);
  });

  return () => socket?.off("messageReaction");
}, [socket, updateMessageReactions]);
```

## 3. **Socket.IO Enhancement**

```javascript
// backend/lib/socket.js - Add reaction event handling
io.on("connection", (socket) => {
  // ... existing socket events

  socket.on("messageReaction", (data) => {
    const { messageId, receiverId, reactions } = data;
    
    // Emit to receiver
    socket.to(receiverId).emit("messageReaction", {
      messageId,
      reactions
    });
  });
});
```

## 4. **Testing the Feature**

### Manual Testing Steps:
1. Send a message between two users
2. Click the emoji button on the message
3. Select an emoji from the picker
4. Verify the reaction appears in real-time
5. Click the same emoji to remove the reaction
6. Test with multiple users reacting to the same message

### API Testing:
```bash
# Add reaction
curl -X POST http://localhost:9000/api/messages/MESSAGE_ID/reactions \
  -H "Content-Type: application/json" \
  -d '{"emoji": "👍"}' \
  --cookie "jwt=YOUR_JWT_TOKEN"

# Get reactions
curl http://localhost:9000/api/messages/MESSAGE_ID/reactions \
  --cookie "jwt=YOUR_JWT_TOKEN"
```

This implementation provides:
- ✅ Real-time reaction updates
- ✅ Multiple emoji support
- ✅ User reaction tracking
- ✅ Reaction count display
- ✅ Toggle reactions on/off
- ✅ Clean UI integration

The same pattern can be applied to implement other missing features like message editing, deletion, and threading!