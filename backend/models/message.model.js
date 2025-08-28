import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
    },
    text: {
      type: String,
    },
    image: {
      type: String,
    },
    fileUrl: {
      type: String,
    },
    fileName: {
      type: String,
    },
    fileType: {
      type: String,
    },
    fileSize: {
      type: Number,
    },
    voiceUrl: {
      type: String,
    },
    voiceDuration: {
      type: Number,
    },
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },
    threadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message", // Points to the root message of the thread
    },
    threadReplies: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    }],
    isThreadReply: {
      type: Boolean,
      default: false,
    },
    threadDepth: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["sent", "delivered", "read"],
      default: "sent",
    },
    readBy: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        readAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    reactions: [
      {
        emoji: String,
        users: [{
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        }],
        count: {
          type: Number,
          default: 0,
        },
      },
    ],
    isEdited: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    hasFormatting: {
      type: Boolean,
      default: false,
    },
    formattingInfo: {
      types: [String], // ['bold', 'italic', 'strikethrough', etc.]
      formattedHtml: String, // HTML version of the formatted text
      plainText: String, // Plain text without formatting markers
    },
    editHistory: [
      {
        text: String,
        editedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    scheduledFor: {
      type: Date,
    },
    isScheduled: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Virtual property to get thread reply count
messageSchema.virtual('threadReplyCount').get(function() {
  return this.threadReplies ? this.threadReplies.length : 0;
});

// Ensure virtual fields are serialized
messageSchema.set('toJSON', { virtuals: true });
messageSchema.set('toObject', { virtuals: true });

// Custom validation to ensure either receiverId or groupId is provided, but not both
messageSchema.pre('validate', function() {
  if (!this.receiverId && !this.groupId) {
    this.invalidate('receiverId', 'Either receiverId or groupId must be provided');
  }
  if (this.receiverId && this.groupId) {
    this.invalidate('receiverId', 'Cannot have both receiverId and groupId');
  }
});

const Message = mongoose.model("Message", messageSchema);

export default Message;
