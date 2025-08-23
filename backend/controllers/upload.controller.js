// controllers/upload.controller.js (A new file)
import cloudinary from "../lib/cloudinary.js";
import { v2 as cloudinaryV2 } from "cloudinary";

export const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded." });
    }

    // Upload the image to Cloudinary from the temporary file path
    const uploadResponse = await cloudinary.uploader.upload(req.file.path, {
      folder: "chat-images", // Optional: specify a folder
    });

    // Delete the temporary file created by multer
    // fs.unlinkSync(req.file.path); // You might need 'fs' to do this

    // Return the URL of the uploaded image
    res.status(200).json({ imageUrl: uploadResponse.secure_url });
  } catch (error) {
    console.error("Error uploading image to Cloudinary:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};