import cloudinary from "../lib/cloudinary.js";
import Message from "../models/message.model.js";
import User from "../models/user.model.js";
import { getReceiverSocketId, io } from "../lib/socket.js";
import {
  formatMessage,
  hasFormattingMarkers,
  getFormattingInfo,
} from "../utils/messageFormatter.js";

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
    })
      .populate("senderId", "fullName profilePic")
      .populate("receiverId", "fullName profilePic")
      .populate("replyTo", "text senderId")
      .populate("threadReplies", "text senderId createdAt")
      .sort({ createdAt: 1 });

    // Process formatting for each message
    const processedMessages = messages.map((message) => {
      if (message.hasFormatting && message.text && !message.formattingInfo) {
        // Backward compatibility: generate formatting info for existing messages
        const formattingInfo = getFormattingInfo(message.text);
        message.formattingInfo = {
          types: formattingInfo.types,
          formattedHtml: formattingInfo.formattedHtml,
          plainText: formattingInfo.plainText,
        };
      }
      return message;
    });

    res.status(200).json(processedMessages);
  } catch (error) {
    console.log("Error in getMessages Controller: ", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Get group messages
export const getGroupMessages = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;

    // Check if user is a member of the group
    const Group = (await import("../models/group.model.js")).default;
    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({ error: "Group not found." });
    }

    if (!group.isMember(userId)) {
      return res
        .status(403)
        .json({ error: "Access denied. You are not a member of this group." });
    }

    const messages = await Message.find({ groupId })
      .populate("senderId", "fullName profilePic")
      .populate("replyTo", "text senderId")
      .populate("threadReplies", "text senderId createdAt")
      .sort({ createdAt: 1 });

    // Process formatting for each message
    const processedMessages = messages.map((message) => {
      if (message.hasFormatting && message.text && !message.formattingInfo) {
        // Backward compatibility: generate formatting info for existing messages
        const formattingInfo = getFormattingInfo(message.text);
        message.formattingInfo = {
          types: formattingInfo.types,
          formattedHtml: formattingInfo.formattedHtml,
          plainText: formattingInfo.plainText,
        };
      }
      return message;
    });

    res.status(200).json(processedMessages);
  } catch (error) {
    console.log("Error in getGroupMessages Controller: ", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const {
      text,
      imageUrl,
      voiceUrl,
      voiceDuration,
      replyTo,
      threadId,
      isThreadReply,
      hasFormatting,
      groupId,
    } = req.body;
    const { id: receiverId } = req.params; // This might be undefined for group messages
    const senderId = req.user._id;

    // Debug logging
    console.log("SendMessage Debug:", {
      receiverId,
      receiverIdType: typeof receiverId,
      groupId,
      groupIdType: typeof groupId,
      hasText: !!text,
      hasImage: !!imageUrl,
      hasVoice: !!voiceUrl,
      requestBody: req.body,
      requestParams: req.params,
    });

    // Check if all content fields are missing.
    if (!text && !imageUrl && !voiceUrl) {
      return res
        .status(400)
        .json({ error: "Message content cannot be empty." });
    }

    // Clean up receiverId and groupId
    const cleanReceiverId =
      receiverId === "undefined" || receiverId === undefined
        ? null
        : receiverId;
    const cleanGroupId =
      groupId === "undefined" || groupId === undefined || groupId === null
        ? null
        : groupId;

    console.log("Cleaned IDs:", {
      originalReceiverId: receiverId,
      cleanReceiverId,
      originalGroupId: groupId,
      cleanGroupId,
    });

    // Validate that either groupId or receiverId is provided, but not both
    if (cleanGroupId && cleanReceiverId) {
      return res.status(400).json({
        error: "Cannot send message to both group and individual user.",
      });
    }

    if (!cleanGroupId && !cleanReceiverId) {
      // Provide specific guidance based on the original values
      if (receiverId === "undefined" && !groupId) {
        return res.status(400).json({
          error:
            "For group messages, use /api/messages/send-group endpoint and include groupId in the request body.",
          hint: "It looks like you're trying to send a group message but using the direct message endpoint.",
        });
      }
      return res
        .status(400)
        .json({ error: "Either groupId or receiverId must be provided." });
    }

    // If groupId is provided, validate group membership
    if (cleanGroupId) {
      const Group = (await import("../models/group.model.js")).default;
      const group = await Group.findById(cleanGroupId);

      if (!group) {
        return res.status(404).json({ error: "Group not found." });
      }

      if (!group.isMember(senderId)) {
        return res
          .status(403)
          .json({ error: "You are not a member of this group." });
      }
    }

    // Handle threading logic
    let threadDepth = 0;
    let finalThreadId = threadId;

    if (replyTo) {
      const parentMessage = await Message.findById(replyTo);
      if (parentMessage) {
        threadDepth = (parentMessage.threadDepth || 0) + 1;
        finalThreadId = parentMessage.threadId || parentMessage._id;
        // Note: We'll update the thread replies after creating the message
      }
    }

    // Process text formatting
    let processedText = text;
    let formattingInfo = null;
    let autoDetectedFormatting = false;

    if (text) {
      // Get formatting information
      formattingInfo = getFormattingInfo(text);

      // Auto-detect formatting if not explicitly set
      if (!hasFormatting && formattingInfo.hasFormatting) {
        autoDetectedFormatting = true;
      }

      console.log("📝 Text formatting analysis:", {
        originalText: text.substring(0, 100) + "...",
        hasFormattingMarkers: formattingInfo.hasFormatting,
        formattingTypes: formattingInfo.types,
        explicitFormatting: hasFormatting,
        autoDetected: autoDetectedFormatting,
      });
    }

    // Create message data object
    const messageData = {
      senderId,
      text: processedText,
      status: "sent", // Set initial status to 'sent'
    };

    // Add groupId or receiverId based on message type
    if (cleanGroupId) {
      messageData.groupId = cleanGroupId;
    } else if (cleanReceiverId) {
      messageData.receiverId = cleanReceiverId;
    }

    // Only include the image field if imageUrl is provided.
    if (imageUrl) {
      messageData.image = imageUrl;
    }

    // Include voice fields if voiceUrl is provided.
    if (voiceUrl) {
      messageData.voiceUrl = voiceUrl;
      messageData.voiceDuration = voiceDuration;
    }

    // Threading fields
    if (replyTo) {
      messageData.replyTo = replyTo;
    }
    if (finalThreadId) {
      messageData.threadId = finalThreadId;
    }
    if (isThreadReply) {
      messageData.isThreadReply = true;
      messageData.threadDepth = threadDepth;
    }

    // Formatting field - set if explicitly provided or auto-detected
    if (hasFormatting || autoDetectedFormatting) {
      messageData.hasFormatting = true;

      // Add formatting metadata
      if (formattingInfo) {
        messageData.formattingInfo = {
          types: formattingInfo.types,
          formattedHtml: formattingInfo.formattedHtml,
          plainText: formattingInfo.plainText,
        };
      }
    }

    console.log("📝 Final message data:", messageData);

    // Create a new message instance.
    const newMessage = new Message(messageData);

    console.log("💾 Saving message to database...");
    // Save the new message to the database.
    await newMessage.save();
    console.log("✅ Message saved successfully:", newMessage._id.toString());

    // Populate sender info
    await newMessage.populate("senderId", "fullName profilePic");

    // Create a sanitized message object for socket emission
    const messageForSocket = {
      ...newMessage.toObject(), // Convert mongoose document to plain object
      senderId: newMessage.senderId._id.toString(), // Ensure senderId is a string
      // receiverId might be a string or undefined for group messages, handle it.
      receiverId: newMessage.receiverId
        ? newMessage.receiverId.toString()
        : undefined,
    };

    // Update thread replies array for the root thread message
    if (finalThreadId && (isThreadReply || replyTo)) {
      console.log("🧵 Updating thread replies:", {
        finalThreadId: finalThreadId.toString(),
        newMessageId: newMessage._id.toString(),
        isThreadReply,
        replyTo: replyTo?.toString(),
      });

      const updateResult = await Message.findByIdAndUpdate(
        finalThreadId,
        {
          $addToSet: { threadReplies: newMessage._id },
        },
        { new: true }
      );

      if (updateResult) {
        console.log(
          "✅ Thread updated successfully. Reply count:",
          updateResult.threadReplies.length
        );
      } else {
        console.log("❌ Failed to update thread - thread message not found");
      }
    } else {
      console.log("🧵 No thread update needed:", {
        finalThreadId: finalThreadId?.toString(),
        isThreadReply,
        replyTo: replyTo?.toString(),
      });
    }

    // Handle real-time updates
    if (cleanGroupId) {
      // Emit to group room
      io.to(`group_${cleanGroupId}`).emit("newGroupMessage", messageForSocket);

      // If this is a thread reply, also emit thread update
      if (finalThreadId && (isThreadReply || replyTo)) {
        io.to(`group_${cleanGroupId}`).emit("threadReplyAdded", {
          threadId: finalThreadId,
          newReply: messageForSocket,
        });
      }

      // Update group's last message and activity
      const Group = (await import("../models/group.model.js")).default;
      await Group.findByIdAndUpdate(cleanGroupId, {
        lastMessage: newMessage._id,
        lastActivity: new Date(),
        $inc: { messageCount: 1 },
      });
    } else {
      // Direct message
      const receiverSocketId = getReceiverSocketId(cleanReceiverId);
      if (receiverSocketId) {
        console.log(
          `📡 Emitting newMessage to receiver ${cleanReceiverId} (${receiverSocketId})`
        );
        io.to(receiverSocketId).emit("newMessage", messageForSocket);
        console.log(`✅ newMessage emitted to ${cleanReceiverId}`);

        // If this is a thread reply, also emit thread update
        if (finalThreadId && (isThreadReply || replyTo)) {
          io.to(receiverSocketId).emit("threadReplyAdded", {
            threadId: finalThreadId,
            newReply: messageForSocket,
          });
        }
      }

      // Also emit to sender for thread updates
      const senderSocketId = getReceiverSocketId(senderId.toString());
      if (senderSocketId && finalThreadId && (isThreadReply || replyTo)) {
        io.to(senderSocketId).emit("threadReplyAdded", {
          threadId: finalThreadId,
          newReply: messageForSocket,
        });
      }
    }

    res.status(200).json(newMessage);
  } catch (error) {
    console.log("Error in sendMessage Controller: ", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const markMessagesAsRead = async (req, res) => {
  try {
    const { id: otherUserId } = req.params;
    const myId = req.user._id;

    // Find all messages sent by 'otherUserId' to 'myId' that are not yet read by 'myId'
    const messagesToMarkAsRead = await Message.find({
      senderId: otherUserId,
      receiverId: myId,
      "readBy.userId": { $ne: myId }, // Ensure we don't mark already read messages
    });

    if (messagesToMarkAsRead.length === 0) {
      return res
        .status(200)
        .json({ message: "No new messages to mark as read." });
    }

    // Update these messages to status 'read' and add 'myId' to readBy array
    await Message.updateMany(
      {
        _id: { $in: messagesToMarkAsRead.map((msg) => msg._id) },
      },
      {
        $set: { status: "read" },
        $push: { readBy: { userId: myId, readAt: new Date() } },
      }
    );

    // Emit a socket event to notify other users (or sender) that messages have been read
    const senderSocketId = getReceiverSocketId(otherUserId);
    if (senderSocketId) {
      io.to(senderSocketId).emit("messagesRead", {
        receiverId: myId,
        senderId: otherUserId,
        messageIds: messagesToMarkAsRead.map((msg) => msg._id),
      });
    }

    res.status(200).json({ message: "Messages marked as read." });
  } catch (error) {
    console.error("Error in markMessagesAsRead Controller: ", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const editMessage = async (req, res) => {
  try {
    const { id: messageId } = req.params;
    const { text } = req.body;
    const userId = req.user._id;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: "Message text cannot be empty." });
    }

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ error: "Message not found." });
    }

    if (message.senderId.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ error: "You are not authorized to edit this message." });
    }

    message.text = text.trim();
    message.isEdited = true;
    message.editedAt = new Date();
    await message.save();

    const receiverSocketId = getReceiverSocketId(message.receiverId.toString());
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("messageUpdated", message);
    }
    // Also emit to the sender themselves to update their UI in other tabs/devices
    const senderSocketId = getReceiverSocketId(message.senderId.toString());
    if (senderSocketId) {
      io.to(senderSocketId).emit("messageUpdated", message);
    }

    res.status(200).json(message);
  } catch (error) {
    console.error("Error in editMessage Controller: ", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const deleteMessage = async (req, res) => {
  try {
    const { id: messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ error: "Message not found." });
    }

    if (message.senderId.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ error: "You are not authorized to delete this message." });
    }

    message.isDeleted = true;
    message.text = ""; // Clear message content
    message.image = ""; // Clear image content
    await message.save();

    const receiverSocketId = getReceiverSocketId(message.receiverId.toString());
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("messageUpdated", message);
    }
    // Also emit to the sender themselves to update their UI in other tabs/devices
    const senderSocketId = getReceiverSocketId(message.senderId.toString());
    if (senderSocketId) {
      io.to(senderSocketId).emit("messageUpdated", message);
    }

    res.status(200).json({ message: "Message deleted successfully." });
  } catch (error) {
    console.error("Error in deleteMessage Controller: ", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Get thread replies for a message
export const getThreadReplies = async (req, res) => {
  try {
    const { id: messageId } = req.params;
    const userId = req.user._id;

    // Find the parent message
    const parentMessage = await Message.findById(messageId)
      .populate("senderId", "fullName profilePic")
      .populate("receiverId", "fullName profilePic");

    if (!parentMessage) {
      return res.status(404).json({ error: "Message not found." });
    }

    // Check if user has access to this conversation
    const hasAccess =
      parentMessage.senderId._id.toString() === userId.toString() ||
      parentMessage.receiverId._id.toString() === userId.toString();

    if (!hasAccess) {
      return res.status(403).json({ error: "Access denied." });
    }

    // Get thread replies
    const threadReplies = await Message.find({
      threadId: parentMessage.threadId || parentMessage._id,
      isThreadReply: true,
    })
      .populate("senderId", "fullName profilePic")
      .populate("replyTo", "text senderId")
      .sort({ createdAt: 1 });

    res.status(200).json({
      parentMessage,
      replies: threadReplies,
    });
  } catch (error) {
    console.error("Error in getThreadReplies Controller: ", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Advanced message search
export const searchMessages = async (req, res) => {
  try {
    const {
      query,
      page = 1,
      limit = 20,
      conversationWith,
      sender,
      messageType,
      dateFrom,
      dateTo,
      hasAttachment,
      hasFormatting,
      inThread,
      sortBy = "date",
      sortOrder = "desc",
    } = req.body;

    const userId = req.user._id;
    const skip = (page - 1) * limit;

    // Build search criteria
    let searchCriteria = {
      $or: [{ senderId: userId }, { receiverId: userId }],
      isDeleted: false,
    };

    // Conversation filter
    if (conversationWith) {
      searchCriteria.$or = [
        { senderId: userId, receiverId: conversationWith },
        { senderId: conversationWith, receiverId: userId },
      ];
    }

    // Text search
    if (query && query.trim()) {
      const searchRegex = new RegExp(query.trim(), "i");
      searchCriteria.text = searchRegex;
    }

    // Sender filter
    if (sender) {
      if (sender === "me") {
        searchCriteria.senderId = userId;
      } else {
        searchCriteria.senderId = sender;
      }
    }

    // Message type filter
    if (messageType && messageType !== "all") {
      switch (messageType) {
        case "text":
          searchCriteria.text = { $exists: true, $ne: "" };
          searchCriteria.image = { $exists: false };
          searchCriteria.voiceUrl = { $exists: false };
          searchCriteria.fileUrl = { $exists: false };
          break;
        case "image":
          searchCriteria.image = { $exists: true, $ne: "" };
          break;
        case "voice":
          searchCriteria.voiceUrl = { $exists: true, $ne: "" };
          break;
        case "file":
          searchCriteria.fileUrl = { $exists: true, $ne: "" };
          break;
      }
    }

    // Date filters
    if (dateFrom || dateTo) {
      searchCriteria.createdAt = {};
      if (dateFrom) {
        searchCriteria.createdAt.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        searchCriteria.createdAt.$lte = endDate;
      }
    }

    // Attachment filter
    if (hasAttachment) {
      searchCriteria.$or = [
        { image: { $exists: true, $ne: "" } },
        { voiceUrl: { $exists: true, $ne: "" } },
        { fileUrl: { $exists: true, $ne: "" } },
      ];
    }

    // Formatting filter
    if (hasFormatting) {
      searchCriteria.hasFormatting = true;
    }

    // Thread filter
    if (inThread) {
      searchCriteria.isThreadReply = true;
    }

    // Sort options
    let sortOptions = {};
    if (sortBy === "date") {
      sortOptions.createdAt = sortOrder === "desc" ? -1 : 1;
    } else if (sortBy === "relevance") {
      // For relevance, we'll use a simple text score
      if (query && query.trim()) {
        sortOptions = { score: { $meta: "textScore" } };
      } else {
        sortOptions.createdAt = -1; // Fallback to date
      }
    }

    // Execute search
    const messages = await Message.find(searchCriteria)
      .populate("senderId", "fullName profilePic")
      .populate("receiverId", "fullName profilePic")
      .populate("replyTo", "text senderId")
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await Message.countDocuments(searchCriteria);
    const hasMore = skip + messages.length < total;

    res.status(200).json({
      messages,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      hasMore,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error in searchMessages Controller: ", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
