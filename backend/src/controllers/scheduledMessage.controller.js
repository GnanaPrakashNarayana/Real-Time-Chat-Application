// backend/src/controllers/scheduledMessage.controller.js
import ScheduledMessage from "../models/scheduledMessage.model.js";
import User from "../models/user.model.js";
import Group from "../models/group.model.js";
import cloudinary from "../lib/cloudinary.js";

export const createScheduledMessage = async (req, res) => {
  try {
    const { receiverId, groupId, text, image, document, voiceMessage, scheduledFor } = req.body;
    const senderId = req.user._id;
    
    // Validate the scheduled time
    const scheduledTime = new Date(scheduledFor);
    const now = new Date();
    
    if (scheduledTime <= now) {
      return res.status(400).json({ message: "Scheduled time must be in the future" });
    }
    
    // Validate that either receiverId or groupId is provided, but not both
    if (receiverId && groupId) {
      return res.status(400).json({ message: "Cannot specify both receiverId and groupId" });
    }
    
    if (!receiverId && !groupId) {
      return res.status(400).json({ message: "Either receiverId or groupId must be specified" });
    }
    
    // Check that the receiver exists
    if (receiverId) {
      const receiver = await User.findById(receiverId);
      if (!receiver) {
        return res.status(404).json({ message: "Receiver not found" });
      }
    }
    
    // Check that the group exists and user is a member
    if (groupId) {
      const group = await Group.findOne({ _id: groupId, members: senderId });
      if (!group) {
        return res.status(404).json({ message: "Group not found or you are not a member" });
      }
    }
    
    // Upload images/files if needed
    let imageUrl;
    let documentData = null;
    let voiceMessageData = null;

    if (image) {
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    if (document) {
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
    }

    if (voiceMessage && voiceMessage.data) {
      const uploadResponse = await cloudinary.uploader.upload(voiceMessage.data, {
        resource_type: "auto",
        folder: "voice_messages",
        public_id: `voice_${Date.now()}`,
      });
      
      voiceMessageData = {
        url: uploadResponse.secure_url,
        duration: voiceMessage.duration || 0,
      };
    }
    
    // Create the scheduled message
    const newScheduledMessage = new ScheduledMessage({
      senderId,
      receiverId,
      groupId,
      text,
      image: imageUrl,
      document: documentData,
      voiceMessage: voiceMessageData,
      scheduledFor: scheduledTime,
    });
    
    await newScheduledMessage.save();
    
    // Return the populated scheduled message
    const populatedMessage = await ScheduledMessage.findById(newScheduledMessage._id)
      .populate("senderId", "fullName profilePic")
      .populate("receiverId", "fullName profilePic")
      .populate("groupId", "name groupPic");
    
    res.status(201).json(populatedMessage);
    
  } catch (error) {
    console.log("Error in createScheduledMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getScheduledMessages = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Get all scheduled messages for this user
    const scheduledMessages = await ScheduledMessage.find({
      senderId: userId,
      status: "scheduled", // Only show messages that haven't been sent yet
    })
      .populate("receiverId", "fullName profilePic")
      .populate("groupId", "name groupPic")
      .sort({ scheduledFor: 1 }); // Sort by scheduled time
    
    res.status(200).json(scheduledMessages);
    
  } catch (error) {
    console.log("Error in getScheduledMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteScheduledMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    
    // Find the scheduled message
    const scheduledMessage = await ScheduledMessage.findById(id);
    
    if (!scheduledMessage) {
      return res.status(404).json({ message: "Scheduled message not found" });
    }
    
    // Ensure the user is the sender
    if (scheduledMessage.senderId.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Not authorized to delete this message" });
    }
    
    // Check if message is already sent
    if (scheduledMessage.status !== "scheduled") {
      return res.status(400).json({ message: "Cannot delete a message that has already been sent" });
    }
    
    // Delete the message
    await ScheduledMessage.findByIdAndDelete(id);
    
    res.status(200).json({ message: "Scheduled message deleted successfully" });
    
  } catch (error) {
    console.log("Error in deleteScheduledMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Update a scheduled message
export const updateScheduledMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { text, scheduledFor } = req.body;
    const userId = req.user._id;
    
    // Find the scheduled message
    const scheduledMessage = await ScheduledMessage.findById(id);
    
    if (!scheduledMessage) {
      return res.status(404).json({ message: "Scheduled message not found" });
    }
    
    // Ensure the user is the sender
    if (scheduledMessage.senderId.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Not authorized to update this message" });
    }
    
    // Check if message is already sent
    if (scheduledMessage.status !== "scheduled") {
      return res.status(400).json({ message: "Cannot update a message that has already been sent" });
    }
    
    // Validate the scheduled time if provided
    if (scheduledFor) {
      const scheduledTime = new Date(scheduledFor);
      const now = new Date();
      
      if (scheduledTime <= now) {
        return res.status(400).json({ message: "Scheduled time must be in the future" });
      }
      
      scheduledMessage.scheduledFor = scheduledTime;
    }
    
    // Update the text if provided
    if (text !== undefined) {
      scheduledMessage.text = text;
    }
    
    await scheduledMessage.save();
    
    // Return the updated message
    const updatedMessage = await ScheduledMessage.findById(id)
      .populate("receiverId", "fullName profilePic")
      .populate("groupId", "name groupPic");
    
    res.status(200).json(updatedMessage);
    
  } catch (error) {
    console.log("Error in updateScheduledMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};