import mongoose from "mongoose";

const groupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxLength: 100,
    },
    description: {
      type: String,
      maxLength: 500,
      default: "",
    },
    profilePic: {
      type: String,
      default: "",
    },
    coverImage: {
      type: String,
      default: "",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    members: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        role: {
          type: String,
          enum: ["admin", "moderator", "member"],
          default: "member",
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
        addedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        permissions: {
          canAddMembers: {
            type: Boolean,
            default: false,
          },
          canRemoveMembers: {
            type: Boolean,
            default: false,
          },
          canEditGroup: {
            type: Boolean,
            default: false,
          },
          canDeleteMessages: {
            type: Boolean,
            default: false,
          },
          canPinMessages: {
            type: Boolean,
            default: false,
          },
        },
      },
    ],
    settings: {
      isPrivate: {
        type: Boolean,
        default: false,
      },
      requireApproval: {
        type: Boolean,
        default: false,
      },
      allowMemberInvites: {
        type: Boolean,
        default: true,
      },
      muteNotifications: {
        type: Boolean,
        default: false,
      },
      messageRetention: {
        type: Number,
        default: 0,
      },
    },
    pinnedMessages: [
      {
        messageId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Message",
        },
        pinnedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        pinnedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    lastActivity: {
      type: Date,
      default: Date.now,
    },
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },
    messageCount: {
      type: Number,
      default: 0,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    inviteCode: {
      type: String,
      unique: true,
      sparse: true,
    },
    inviteExpiry: {
      type: Date,
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
    archivedAt: {
      type: Date,
    },
    archivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

groupSchema.virtual('memberCount').get(function() {
  return this.members ? this.members.length : 0;
});

groupSchema.virtual('admins').get(function() {
  return this.members ? this.members.filter(member => member.role === 'admin') : [];
});

groupSchema.virtual('onlineMembers').get(function() {
  return this.members ? this.members.filter(member => 
    member.userId && member.userId.isOnline
  ) : [];
});

groupSchema.index({ createdBy: 1 });
groupSchema.index({ 'members.userId': 1 });
groupSchema.index({ lastActivity: -1 });
groupSchema.index({ inviteCode: 1 });
groupSchema.index({ isArchived: 1 });

groupSchema.pre('save', function(next) {
  this.lastActivity = new Date();
  next();
});

groupSchema.methods.isMember = function(userId) {
  return this.members.some(member => 
    member.userId.toString() === userId.toString()
  );
};

groupSchema.methods.isAdmin = function(userId) {
  const member = this.members.find(member => 
    member.userId.toString() === userId.toString()
  );
  return member && member.role === 'admin';
};

groupSchema.methods.isModerator = function(userId) {
  const member = this.members.find(member => 
    member.userId.toString() === userId.toString()
  );
  return member && (member.role === 'admin' || member.role === 'moderator');
};

groupSchema.methods.getMemberRole = function(userId) {
  const member = this.members.find(member => 
    member.userId.toString() === userId.toString()
  );
  return member ? member.role : null;
};

groupSchema.methods.hasPermission = function(userId, permission) {
  const member = this.members.find(member => 
    member.userId.toString() === userId.toString()
  );
  
  if (!member) return false;
  if (member.role === 'admin') return true;
  
  return member.permissions && member.permissions[permission];
};

groupSchema.methods.generateInviteCode = function() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

const Group = mongoose.model("Group", groupSchema);

export default Group;