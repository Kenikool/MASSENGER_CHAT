// controllers/upload.controller.js
import cloudinary from "../lib/cloudinary.js";
import { v2 as cloudinaryV2 } from "cloudinary";
import File from "../models/File.js";
import User from "../models/user.model.js";

export const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded." });
    }

    // You can get the senderId from the authenticated user
    const senderId = req.user._id;

    // Upload the image to Cloudinary from the temporary file path
    const uploadResponse = await cloudinary.uploader.upload(req.file.path, {
      folder: "chat-images", // Optional: specify a folder
    });

    // Create and save a new File document
    const newFile = new File({
      senderId: senderId,
      fileUrl: uploadResponse.secure_url,
      fileName: req.file.originalname,
      fileType: req.file.mimetype,
    });

    await newFile.save();
    console.log("File document saved to database!");

    // Check and award the "Collaborator" badge
    const user = await User.findById(senderId);
    if (user) {
      const badgeName = "Collaborator";
      if (!user.badges.includes(badgeName)) {
        user.badges.push(badgeName);
        user.seenBadges.push(badgeName);
        await user.save();
        console.log(`User ${user.fullName} earned the '${badgeName}' badge.`);
      }
    }

    // Delete the temporary file created by multer
    // fs.unlinkSync(req.file.path);

    // Return the URL of the uploaded image and a success message
    res.status(200).json({
      imageUrl: uploadResponse.secure_url,
      message: "File uploaded and recorded successfully!",
    });
  } catch (error) {
    console.error("Error uploading image to Cloudinary:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
