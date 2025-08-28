import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      minLength: 6,
    },
    profilePic: {
      type: String,
      default: "",
    },
    about: {
      type: String,
    },
    lastSeen: {
      // ✅ Add this new field
      type: Date,
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    badges: {
      // ✅ Add the new badges field
      type: [String],
      type: [String],
      default: [],
    },
    seenBadges: {
      // NEW FIELD
      type: [String],
      default: [],
    },
    twoFactorSecret: {
      type: String,
      required: false, // Make it optional initially
    },
    isVerified: {
      // ✅ New field
      type: Boolean,
      default: false,
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
    publicBadges: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      default: "Online",
    },
    profileTheme: {
      type: String,
      default: "default",
    },
    socialMediaLinks: {
      type: Map,
      of: String,
      default: {},
    },
    magicLinkToken: String,
    magicLinkTokenExpires: Date,
    sessions: [
      {
        _id: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
          auto: true,
        },
        token: String,
        createdAt: { type: Date, default: Date.now },
        userAgent: String, // Store user agent for display
      },
    ],
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;
