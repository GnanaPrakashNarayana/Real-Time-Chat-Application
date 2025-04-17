import User from "../models/user.model.js";
import Message from "../models/message.model.js";

import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    console.log("Logged in user ID:", loggedInUserId);
    
    const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } }).select("-password");
    console.log("Found users:", filteredUsers);
    
    res.status(200).json(filteredUsers);
  } catch (error) {
    console.error("Error in getUsersForSidebar: ", error.message);
    res.status(500).json({ error: "Internal server error" });
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
    console.log("Error in getMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    // Get data from request body
    const { text, image, document, voiceMessage } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    let imageUrl;
    let documentData = null;
    let voiceMessageData = null;

    if (image) {
      // Upload base64 image to cloudinary
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    if (document) {
      // Upload document to cloudinary
      try {
        const uploadResponse = await cloudinary.uploader.upload(document.data, {
          resource_type: "auto",
          folder: "chat_documents",
          public_id: `${Date.now()}_${document.name}`,
        });
        
        documentData = {
          url: uploadResponse.secure_url,
          name: document.name,
          type: document.type,
          size: document.size,
        };
      } catch (uploadError) {
        console.error("Document upload error:", uploadError);
        return res.status(400).json({ error: "Failed to upload document" });
      }
    }

    // Handle voice message upload
    if (voiceMessage && voiceMessage.data) {
      try {
        const uploadResponse = await cloudinary.uploader.upload(voiceMessage.data, {
          resource_type: "auto",
          folder: "voice_messages",
          public_id: `voice_${Date.now()}`,
        });
        
        voiceMessageData = {
          url: uploadResponse.secure_url,
          duration: voiceMessage.duration || 0,
        };
      } catch (uploadError) {
        console.error("Voice message upload error:", uploadError);
        return res.status(400).json({ error: "Failed to upload voice message" });
      }
    }

    // Create the message with all possible content types
    const newMessage = new Message({
      senderId,
      receiverId,
      text, 
      image: imageUrl,
      document: documentData,
      voiceMessage: voiceMessageData,
    });

    await newMessage.save();

    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.log("Error in sendMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const markMessagesAsRead = async (req, res) => {
  try {
    const { id: senderId } = req.params;
    const receiverId = req.user._id;

    // Mark all messages from sender to receiver as read
    const updatedMessages = await Message.updateMany(
      { senderId, receiverId, read: false },
      { read: true }
    );

    // Notify sender via socket that messages were read
    const senderSocketId = getReceiverSocketId(senderId);
    if (senderSocketId) {
      io.to(senderSocketId).emit("messagesRead", receiverId);
    }

    res.status(200).json({ success: true, modifiedCount: updatedMessages.modifiedCount });
  } catch (error) {
    console.log("Error in markMessagesAsRead controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const reactToMessage = async (req, res) => {
  try {
    const { id: messageId } = req.params;
    const { emoji } = req.body;
    const userId = req.user._id;

    if (!emoji) {
      return res.status(400).json({ message: "Emoji is required" });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    // Check if user already reacted with this emoji
    const existingReactionIndex = message.reactions ? 
      message.reactions.findIndex(r => 
        r.userId.toString() === userId.toString() && r.emoji === emoji
      ) : -1;

    if (!message.reactions) {
      message.reactions = [];
    }

    if (existingReactionIndex >= 0) {
      // Remove reaction if it already exists
      message.reactions.splice(existingReactionIndex, 1);
    } else {
      // Add new reaction
      message.reactions.push({ emoji, userId });
    }

    await message.save();

    // Notify the other user about the reaction
    const otherUserId = message.senderId.toString() === userId.toString() 
      ? message.receiverId 
      : message.senderId;
    
    const receiverSocketId = getReceiverSocketId(otherUserId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("messageReaction", {
        messageId: message._id,
        reaction: existingReactionIndex >= 0 ? null : { emoji, userId },
        removed: existingReactionIndex >= 0
      });
    }

    res.status(200).json(message);
  } catch (error) {
    console.log("Error in reactToMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};