// controllers/voice.controller.js
import cloudinary from "../lib/cloudinary.js";
import File from "../models/File.js";
import User from "../models/user.model.js";

export const uploadVoice = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No voice file uploaded." });
    }

    console.log('Voice upload request:', {
      file: req.file,
      duration: req.body.duration
    });

    // Get the senderId from the authenticated user
    const senderId = req.user._id;
    const duration = req.body.duration || 0;

    // Upload the voice file to Cloudinary
    const uploadResponse = await cloudinary.uploader.upload(req.file.path, {
      folder: "chat-voices", // Separate folder for voice messages
      resource_type: "video", // Use 'video' for audio files in Cloudinary
      format: "webm", // Ensure webm format
    });

    console.log('Cloudinary upload response:', uploadResponse);

    // Create and save a new File document
    const newFile = new File({
      senderId: senderId,
      fileUrl: uploadResponse.secure_url,
      fileName: req.file.originalname,
      fileType: req.file.mimetype,
      duration: parseInt(duration),
    });

    await newFile.save();
    console.log("Voice file document saved to database!");

    // Check and award the "Voice Messenger" badge
    const user = await User.findById(senderId);
    if (user) {
      const badgeName = "Voice Messenger";
      if (!user.badges.includes(badgeName)) {
        user.badges.push(badgeName);
        user.seenBadges.push(badgeName);
        await user.save();
        console.log(`User ${user.fullName} earned the '${badgeName}' badge.`);
      }
    }

    // Return the URL of the uploaded voice file
    res.status(200).json({
      voiceUrl: uploadResponse.secure_url,
      duration: duration,
      message: "Voice file uploaded successfully!",
    });
  } catch (error) {
    console.error("Error uploading voice to Cloudinary:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};