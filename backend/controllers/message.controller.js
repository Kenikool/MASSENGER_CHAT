import cloudinary from "../lib/cloudinary.js";
import Message from "../models/message.model.js";
import User from "../models/user.model.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

export const getUserForSidebar = async (req, res) => {
  try {
    const loggedUserId = req.user._id;
    const filteredUsers = await User.find({
      _id: { $ne: loggedUserId },
    }).select("-password");
    res.status(200).json(filteredUsers);
  } catch (error) {
    console.log("Error in message controller", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    });
    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getMessages Controller: ", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text, imageUrl } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    // Check if both text and imageUrl are missing.
    // The previous code had a syntax error in this block.
    if (!text && !imageUrl) {
      return res
        .status(400)
        .json({ error: "Message content cannot be empty." });
    }

    // Create a new message instance.
    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      // Only include the image field if imageUrl is provided.
      // This prevents saving a null or undefined value for the image.
      ...(imageUrl && { image: imageUrl }),
    });

    // Save the new message to the database.
    await newMessage.save();

    // The rest of the real-time logic remains the same.
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    res.status(200).json(newMessage);
  } catch (error) {
    // The 'catch' block was missing its opening curly brace.
    console.log("Error in sendMessage Controller: ", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
