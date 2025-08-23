import cloudinary from "../lib/cloudinary.js";
import Message from "../models/message.model.js";
import User from "../models/user.model.js";
//import { getReceiverSocketId, io } from "../lib/socket.js";

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

    
    if (!text && !imageUrl) {
      return res.status(400).json({ error: "Message content cannot be empty." });
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      text,
     
      image: imageUrl,
    });

    await newMessage.save();

    // todo: realtime functionality goes here => socket.io
    res.status(200).json(newMessage);
  } catch (error) {
    console.log("Error in sendMessage Controller: ", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
