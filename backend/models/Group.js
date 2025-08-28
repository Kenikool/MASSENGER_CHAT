import mongoose from "mongoose";

const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  description: {
    type: String,
    maxlength: 500,
  },
  avatar: {
    type: String,
    default: "/group-avatar.png",
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  admins: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  }],
  members: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    role: {
      type: String,
      enum: ["admin", "member"],
      default: "member",
    },
  }],
  settings: {
    isPrivate: {
      type: Boolean,
      default: false,
    },
    allowMemberInvite: {
      type: Boolean,
      default: true,
    },
    allowFileSharing: {
      type: Boolean,
      default: true,
    },
    maxMembers: {
      type: Number,
      default: 100,
    },
  },
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Message",
  },
  lastActivity: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Index for efficient queries
groupSchema.index({ "members.userId": 1 });
groupSchema.index({ createdBy: 1 });
groupSchema.index({ lastActivity: -1 });

const Group = mongoose.model("Group", groupSchema);
export default Group;