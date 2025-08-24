import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import File from "../models/File.js";
import dayjs from "dayjs";

export const getUserAchievements = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).select("badges");

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    res.status(200).json(user.badges);
  } catch (error) {
    console.error("Error fetching achievements:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getBadgeProgress = async (req, res) => {
  try {
    const userId = req.user._id;

    // Fetch user's message and file counts
    const messageCount = await Message.countDocuments({ senderId: userId });
    const fileCount = await File.countDocuments({ senderId: userId });

    // Calculate a basic progress for a "Message Master" badge (1000 messages)
    const messageMasterProgress = Math.min(100, (messageCount / 1000) * 100);

    // You'll need to define your own logic for other badges
    const progressData = {
      "Message Master": {
        progress: messageMasterProgress,
        goal: 1000,
        current: messageCount,
      },
      // Add other badge progress here (e.g., file sharing, daily streaks)
    };

    res.status(200).json(progressData);
  } catch (error) {
    console.error("Error fetching badge progress:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getLeaderboard = async (req, res) => {
  try {
    // Fetch users and sort them by a criteria like message count or badges
    const leaderboard = await User.aggregate([
      {
        $lookup: {
          from: "messages",
          localField: "_id",
          foreignField: "senderId",
          as: "messages",
        },
      },
      {
        $project: {
          _id: 1,
          fullName: 1,
          profilePic: 1,
          messageCount: { $size: "$messages" },
        },
      },
      {
        $sort: { messageCount: -1 },
      },
      {
        $limit: 10,
      },
    ]);

    res.status(200).json(leaderboard);
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const awardCollaboratorBadge = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    const badgeName = "Collaborator";
    if (!user.badges.includes(badgeName)) {
      user.badges.push(badgeName);
      user.seenBadges.push(badgeName); // Mark it as seen for the initial award
      await user.save();
      // Optional: You can send a notification to the user here
      console.log(`User ${user.fullName} earned the '${badgeName}' badge.`);
    }

    next(); // Pass control to the next middleware or controller
  } catch (error) {
    console.error("Error awarding Collaborator badge:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
