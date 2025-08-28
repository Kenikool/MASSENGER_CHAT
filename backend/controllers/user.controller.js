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

export const getPublicProfile = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    if (!user.isPublic) {
      return res.status(403).json({ error: "This profile is private." });
    }

    // Return only public data
    const publicProfile = {
      fullName: user.fullName,
      profilePic: user.profilePic,
      about: user.about,
      status: user.status,
      profileTheme: user.profileTheme,
      socialMediaLinks: user.socialMediaLinks,
      publicBadges: user.publicBadges,
    };

    res.status(200).json(publicProfile);
  } catch (error) {
    console.error("Error in getPublicProfile controller:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const userId = req.user._id;

    if (!status) {
      return res.status(400).json({ error: "Status is required." });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { status },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("Error in updateStatus controller:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const updateProfileCustomization = async (req, res) => {
  try {
    const { profileTheme, socialMediaLinks, isPublic, publicBadges } = req.body;
    const userId = req.user._id;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    if (profileTheme) {
      user.profileTheme = profileTheme;
    }

    if (socialMediaLinks) {
      user.socialMediaLinks = socialMediaLinks;
    }

    if (typeof isPublic === "boolean") {
      user.isPublic = isPublic;
    }

    if (publicBadges && Array.isArray(publicBadges)) {
      user.publicBadges = publicBadges;
    }

    await user.save();

    res.status(200).json(user);
  } catch (error) {
    console.error(
      "Error in updateProfileCustomization controller:",
      error.message
    );
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getPublicStats = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }
    
    // Only return stats if profile is public
    if (!user.isPublic) {
      return res.status(403).json({ error: "This user's statistics are private." });
    }
    
    // Get basic public statistics
    const messageCount = await Message.countDocuments({ senderId: userId });
    const badgeCount = user.badges ? user.badges.length : 0;
    const accountAgeDays = dayjs().diff(dayjs(user.createdAt), "day");
    
    res.status(200).json({
      messageCount,
      badgeCount,
      accountAgeDays,
      joinedDate: user.createdAt
    });
  } catch (error) {
    console.error("Error in getPublicStats controller:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
