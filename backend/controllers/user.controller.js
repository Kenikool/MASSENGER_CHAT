// controllers/user.controller.js

import Message from "../models/message.model.js";
import User from "../models/user.model.js";
import dayjs from "dayjs";
import File from "../models/File.js";

export const getUserStats = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const messagesSent = await Message.countDocuments({ senderId: userId });
    const filesShared = await File.countDocuments({ senderId: userId }); // Assuming a File model exists
    const accountAgeDays = dayjs().diff(dayjs(user.createdAt), "day");

    const newBadges = [];

    // Check for 'First Message' badge
    if (messagesSent > 0 && !user.badges.includes("First Message")) {
      newBadges.push("First Message");
    }

    // Check for 'Chatterbox' badge
    if (messagesSent >= 10 && !user.badges.includes("Chatterbox")) {
      newBadges.push("Chatterbox");
    }

    // Check for 'Early Adopter' badge
    if (accountAgeDays >= 365 && !user.badges.includes("Early Adopter")) {
      newBadges.push("Early Adopter");
    }

    // Check for 'Files Shared' badge
    if (filesShared >= 1 && !user.badges.includes("Files Shared")) {
      newBadges.push("Files Shared");
    }

    // Check for 'Login Streak' badge (requires a loginStreak field on the User model)
    if (user.loginStreak >= 7 && !user.badges.includes("7-Day Streak")) {
      newBadges.push("7-Day Streak");
    }

    // Add any newly earned badges to the user's profile in a single update
    if (newBadges.length > 0) {
      await User.findByIdAndUpdate(userId, {
        $addToSet: { badges: { $each: newBadges } },
      });
    }

    // Fetch the updated user data to return
    const updatedUser = await User.findById(userId);

    res.status(200).json({
      messagesSent,
      filesShared,
      accountAgeDays,
      badges: updatedUser.badges,
    });
  } catch (error) {
    console.error("Error in getUserStats controller:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
