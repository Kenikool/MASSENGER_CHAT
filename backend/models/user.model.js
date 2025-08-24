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
    badges: {
      // ✅ Add the new badges field
      type: [String],
      type: [String],
      default: [],
    },
    twoFactorSecret: {
      type: String,
      required: false, // Make it optional initially
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;
