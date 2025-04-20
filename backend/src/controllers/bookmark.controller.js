// backend/src/controllers/bookmark.controller.js
import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import GroupMessage from "../models/groupMessage.model.js";
import mongoose from "mongoose";

export const addBookmark = async (req, res) => {
  try {
    const { messageId, messageType, conversationId, conversationType, name } = req.body;
    const userId = req.user._id;

    if (!messageId || !messageType || !conversationId || !conversationType) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Verify the message exists
    let message;
    if (messageType === 'Message') {
      message = await Message.findById(messageId);
    } else if (messageType === 'GroupMessage') {
      message = await GroupMessage.findById(messageId);
    }

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    // Add bookmark to user
    const bookmarkId = new mongoose.Types.ObjectId();
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $push: {
          bookmarks: {
            _id: bookmarkId,
            messageId,
            messageType,
            conversationId,
            conversationType,
            name: name || "",
            createdAt: new Date()
          }
        }
      },
      { new: true }
    );

    const newBookmark = updatedUser.bookmarks.find(b => b._id.toString() === bookmarkId.toString());

    res.status(201).json(newBookmark);
  } catch (error) {
    console.log("Error in addBookmark controller:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const removeBookmark = async (req, res) => {
  try {
    const { bookmarkId } = req.params;
    const userId = req.user._id;

    await User.findByIdAndUpdate(
      userId,
      {
        $pull: {
          bookmarks: { _id: bookmarkId }
        }
      }
    );

    res.status(200).json({ message: "Bookmark removed successfully" });
  } catch (error) {
    console.log("Error in removeBookmark controller:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getBookmarks = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId).select("bookmarks");
    
    // Sort bookmarks by date (newest first)
    const bookmarks = user.bookmarks.sort((a, b) => b.createdAt - a.createdAt);

    // Populate message and conversation details for each bookmark
    const populatedBookmarks = await Promise.all(
      bookmarks.map(async (bookmark) => {
        let messageDetails = null;
        let conversationDetails = null;

        // Get message details
        if (bookmark.messageType === 'Message') {
          messageDetails = await Message.findById(bookmark.messageId);
        } else if (bookmark.messageType === 'GroupMessage') {
          messageDetails = await GroupMessage.findById(bookmark.messageId)
            .populate("senderId", "fullName profilePic");
        }

        // Get conversation details
        if (bookmark.conversationType === 'User') {
          conversationDetails = await User.findById(bookmark.conversationId)
            .select("fullName profilePic");
        } else if (bookmark.conversationType === 'Group') {
          const Group = mongoose.model('Group');
          conversationDetails = await Group.findById(bookmark.conversationId)
            .select("name groupPic");
        }

        return {
          _id: bookmark._id,
          messageId: bookmark.messageId,
          messageType: bookmark.messageType,
          conversationId: bookmark.conversationId,
          conversationType: bookmark.conversationType,
          name: bookmark.name,
          createdAt: bookmark.createdAt,
          message: messageDetails,
          conversation: conversationDetails
        };
      })
    );

    res.status(200).json(populatedBookmarks);
  } catch (error) {
    console.log("Error in getBookmarks controller:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const renameBookmark = async (req, res) => {
  try {
    const { bookmarkId } = req.params;
    const { name } = req.body;
    const userId = req.user._id;

    if (!name) {
      return res.status(400).json({ message: "Name is required" });
    }

    const updatedUser = await User.findOneAndUpdate(
      { _id: userId, "bookmarks._id": bookmarkId },
      { $set: { "bookmarks.$.name": name } },
      { new: true }
    );

    const updatedBookmark = updatedUser.bookmarks.find(b => b._id.toString() === bookmarkId);

    res.status(200).json(updatedBookmark);
  } catch (error) {
    console.log("Error in renameBookmark controller:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};