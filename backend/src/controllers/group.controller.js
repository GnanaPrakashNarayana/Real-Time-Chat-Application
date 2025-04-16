// backend/src/controllers/group.controller.js
import Group from "../models/group.model.js";
import GroupMessage from "../models/groupMessage.model.js";
import cloudinary from "../lib/cloudinary.js";

import { io, getReceiverSocketId } from "../lib/socket.js";



// Add this function to your group.controller.js file
function getReceiverSocketIdLocal(userId) {
    // Use the same userSocketMap that the original function uses
    return userSocketMap[userId];
  }

export const createGroup = async (req, res) => {
  try {
    const { name, description, members, groupPic } = req.body;
    const admin = req.user._id;

    if (!name) {
      return res.status(400).json({ message: "Group name is required" });
    }

    let groupPicUrl = "";
    if (groupPic) {
      const uploadResponse = await cloudinary.uploader.upload(groupPic);
      groupPicUrl = uploadResponse.secure_url;
    }

    // Create new group
    const newGroup = new Group({
      name,
      description,
      admin,
      members: [...members, admin], // Include admin in members
      groupPic: groupPicUrl,
    });

    await newGroup.save();

    // Populate member information
    const populatedGroup = await Group.findById(newGroup._id)
      .populate("members", "fullName email profilePic")
      .populate("admin", "fullName email profilePic");

    // Notify all members about new group
    populatedGroup.members.forEach((member) => {
      if (member._id.toString() !== admin.toString()) {
        const socketId = getReceiverSocketId(member._id);
        if (socketId) {
          io.to(socketId).emit("newGroup", populatedGroup);
        }
      }
    });

    res.status(201).json(populatedGroup);
  } catch (error) {
    console.log("Error in createGroup controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getGroups = async (req, res) => {
  try {
    const userId = req.user._id;

    // Find all groups where user is a member
    const groups = await Group.find({ members: userId })
      .populate("members", "fullName email profilePic")
      .populate("admin", "fullName email profilePic")
      .sort({ updatedAt: -1 });

    res.status(200).json(groups);
  } catch (error) {
    console.log("Error in getGroups controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getGroupMessages = async (req, res) => {
  try {
    const { id: groupId } = req.params;
    const userId = req.user._id;

    // Check if user is a member of the group
    const group = await Group.findOne({ _id: groupId, members: userId });
    if (!group) {
      return res.status(403).json({ message: "You are not a member of this group" });
    }

    const messages = await GroupMessage.find({ groupId })
      .populate("senderId", "fullName profilePic")
      .sort({ createdAt: 1 });

    // Mark messages as read by this user
    await GroupMessage.updateMany(
      { 
        groupId,
        readBy: { $ne: userId }
      },
      { $push: { readBy: userId } }
    );

    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getGroupMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendGroupMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    const { id: groupId } = req.params;
    const senderId = req.user._id;

    // Check if user is a member of the group
    const group = await Group.findOne({ _id: groupId, members: senderId });
    if (!group) {
      return res.status(403).json({ message: "You are not a member of this group" });
    }

    let imageUrl;
    if (image) {
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    const newMessage = new GroupMessage({
      groupId,
      senderId,
      text,
      image: imageUrl,
      readBy: [senderId], // Mark as read by sender
    });

    await newMessage.save();

    // Populate sender info
    const populatedMessage = await GroupMessage.findById(newMessage._id)
      .populate("senderId", "fullName profilePic");

    // Notify all group members except sender
    group.members.forEach((memberId) => {
      if (memberId.toString() !== senderId.toString()) {
        const socketId = getReceiverSocketId(memberId);
        if (socketId) {
          io.to(socketId).emit("newGroupMessage", {
            message: populatedMessage,
            group: {
              _id: group._id,
              name: group.name,
              groupPic: group.groupPic
            }
          });
        }
      }
    });

    res.status(201).json(populatedMessage);
  } catch (error) {
    console.log("Error in sendGroupMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const addMembersToGroup = async (req, res) => {
  try {
    const { groupId, memberIds } = req.body;
    const userId = req.user._id;

    // Check if user is admin of the group
    const group = await Group.findOne({ _id: groupId, admin: userId });
    if (!group) {
      return res.status(403).json({ message: "You don't have permission to add members" });
    }

    // Add new members
    group.members.push(...memberIds.filter(id => !group.members.includes(id)));
    await group.save();

    // Get updated group
    const updatedGroup = await Group.findById(groupId)
      .populate("members", "fullName email profilePic")
      .populate("admin", "fullName email profilePic");

    // Notify new members
    memberIds.forEach((memberId) => {
      const socketId = getReceiverSocketId(memberId);
      if (socketId) {
        io.to(socketId).emit("addedToGroup", updatedGroup);
      }
    });

    // Notify existing members
    group.members.forEach((memberId) => {
      if (!memberIds.includes(memberId.toString()) && memberId.toString() !== userId.toString()) {
        const socketId = getReceiverSocketId(memberId);
        if (socketId) {
          io.to(socketId).emit("groupUpdated", updatedGroup);
        }
      }
    });

    res.status(200).json(updatedGroup);
  } catch (error) {
    console.log("Error in addMembersToGroup controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const removeMemberFromGroup = async (req, res) => {
  try {
    const { groupId, memberId } = req.params;
    const userId = req.user._id;

    // Check if user is admin of the group or removing self (leaving group)
    const group = await Group.findById(groupId);
    
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }
    
    const isAdmin = group.admin.toString() === userId.toString();
    const isSelf = memberId === userId.toString();
    
    if (!isAdmin && !isSelf) {
      return res.status(403).json({ message: "You don't have permission to remove members" });
    }
    
    // Admin can't be removed unless they're removing themselves
    if (memberId === group.admin.toString() && !isSelf) {
      return res.status(400).json({ message: "Cannot remove group admin" });
    }

    // Remove member
    group.members = group.members.filter(
      (id) => id.toString() !== memberId
    );
    
    // If admin is leaving, assign new admin if members exist
    if (isSelf && isAdmin && group.members.length > 0) {
      group.admin = group.members[0];
    }
    
    // If no members left, delete the group
    if (group.members.length === 0) {
      await Group.findByIdAndDelete(groupId);
      return res.status(200).json({ message: "Group deleted as no members remain" });
    }
    
    await group.save();

    // Get updated group
    const updatedGroup = await Group.findById(groupId)
      .populate("members", "fullName email profilePic")
      .populate("admin", "fullName email profilePic");

    // Notify removed member
    const removedSocketId = getReceiverSocketId(memberId);
    if (removedSocketId) {
      io.to(removedSocketId).emit("removedFromGroup", { 
        groupId, 
        message: isSelf ? "You left the group" : "You were removed from the group" 
      });
    }

    // Notify remaining members
    group.members.forEach((memberId) => {
      if (memberId.toString() !== userId.toString()) {
        const socketId = getReceiverSocketId(memberId);
        if (socketId) {
          io.to(socketId).emit("groupUpdated", updatedGroup);
        }
      }
    });

    res.status(200).json(updatedGroup);
  } catch (error) {
    console.log("Error in removeMemberFromGroup controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// backend/src/controllers/group.controller.js
// Add this method to the existing file

export const reactToGroupMessage = async (req, res) => {
    try {
      const { id: messageId } = req.params;
      const { emoji } = req.body;
      const userId = req.user._id;
  
      if (!emoji) {
        return res.status(400).json({ message: "Emoji is required" });
      }
  
      const message = await GroupMessage.findById(messageId);
      if (!message) {
        return res.status(404).json({ message: "Message not found" });
      }
  
      // Check if user is a member of the group
      const group = await Group.findById(message.groupId);
      if (!group || !group.members.includes(userId)) {
        return res.status(403).json({ message: "You are not a member of this group" });
      }
  
      // Initialize reactions array if it doesn't exist
      if (!message.reactions) {
        message.reactions = [];
      }
  
      // Check if user already reacted with this emoji
      const existingReactionIndex = message.reactions.findIndex(
        r => r.userId.toString() === userId.toString() && r.emoji === emoji
      );
  
      if (existingReactionIndex >= 0) {
        // Remove reaction if it already exists
        message.reactions.splice(existingReactionIndex, 1);
      } else {
        // Add new reaction
        message.reactions.push({ emoji, userId });
      }
  
      await message.save();
  
      // Notify all group members about the reaction
      if (group.members && group.members.length > 0) {
        group.members.forEach((memberId) => {
          if (memberId.toString() !== userId.toString()) {
            const socketId = getReceiverSocketId(memberId);
            if (socketId) {
              io.to(socketId).emit("groupMessageReaction", {
                messageId: message._id,
                groupId: group._id,
                reaction: existingReactionIndex >= 0 ? null : { emoji, userId },
                removed: existingReactionIndex >= 0
              });
            }
          }
        });
      }
  
      res.status(200).json(message);
    } catch (error) {
      console.log("Error in reactToGroupMessage controller:", error.message);
      res.status(500).json({ error: "Internal server error", details: error.message });
    }
  };

  export const removeGroupMember = async (req, res) => {
    try {
      const { groupId, memberId } = req.params;
      const userId = req.user._id;
  
      // Check if user is admin of the group or removing self (leaving group)
      const group = await Group.findById(groupId);
      
      if (!group) {
        return res.status(404).json({ message: "Group not found" });
      }
      
      const isAdmin = group.admin.toString() === userId.toString();
      const isSelf = memberId === userId.toString();
      
      if (!isAdmin && !isSelf) {
        return res.status(403).json({ message: "You don't have permission to remove members" });
      }
      
      // Admin can't be removed unless they're removing themselves
      if (memberId === group.admin.toString() && !isSelf) {
        return res.status(400).json({ message: "Cannot remove group admin" });
      }
  
      // Remove member
      group.members = group.members.filter(
        (id) => id.toString() !== memberId
      );
      
      // If admin is leaving, assign new admin if members exist
      if (isSelf && isAdmin && group.members.length > 0) {
        group.admin = group.members[0];
      }
      
      // If no members left, delete the group
      if (group.members.length === 0) {
        await Group.findByIdAndDelete(groupId);
        return res.status(200).json({ message: "Group deleted as no members remain" });
      }
      
      await group.save();
  
      // Get updated group
      const updatedGroup = await Group.findById(groupId)
        .populate("members", "fullName email profilePic")
        .populate("admin", "fullName email profilePic");
  
      // Notify removed member
      const removedSocketId = getReceiverSocketId(memberId);
      if (removedSocketId) {
        io.to(removedSocketId).emit("removedFromGroup", { 
          groupId, 
          message: isSelf ? "You left the group" : "You were removed from the group" 
        });
      }
  
      // Notify remaining members
      if (group.members && group.members.length > 0) {
        group.members.forEach((memberId) => {
          if (memberId.toString() !== userId.toString()) {
            const socketId = getReceiverSocketId(memberId);
            if (socketId) {
              io.to(socketId).emit("groupUpdated", updatedGroup);
            }
          }
        });
      }
  
      res.status(200).json(updatedGroup);
    } catch (error) {
      console.log("Error in removeGroupMember controller: ", error.message);
      res.status(500).json({ error: "Internal server error", details: error.message });
    }
  };