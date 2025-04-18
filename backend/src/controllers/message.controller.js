// backend/src/controllers/message.controller.js
import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

import { summariseWithHF } from "../lib/hfSummarizer.js";   // 🆕 HF helper

/* -------------------------------------------------------------------------- */
/*                               SIDEBAR USERS                                */
/* -------------------------------------------------------------------------- */
export const getUsersForSidebar = async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user._id } }).select(
      "-password"
    );
    return res.status(200).json(users);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

/* -------------------------------------------------------------------------- */
/*                            FETCH ALL CHAT MESSAGES                         */
/* -------------------------------------------------------------------------- */
export const getMessages = async (req, res) => {
  try {
    const { id: otherUserId } = req.params;
    const myId = req.user._id;

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: myId },
      ],
    });

    return res.status(200).json(messages);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

/* -------------------------------------------------------------------------- */
/*                        ✨  CONVERSATION SUMMARY  ✨                          */
/* -------------------------------------------------------------------------- */
export const getConversationSummary = async (req, res) => {
  try {
    const { id: otherUserId } = req.params;
    const myId = req.user._id;

    // Pull last 40 messages with non‑empty text
    const msgs = await Message.find({
      $or: [
        { senderId: myId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: myId },
      ],
      text: { $exists: true, $ne: "" },
    })
      .sort({ createdAt: -1 })
      .limit(40);

    if (msgs.length === 0)
      return res.status(200).json({ summary: "No messages yet to summarise." });

    const transcript = msgs
      .reverse()
      .map(
        (m) =>
          `${m.senderId.toString() === myId.toString() ? "You" : "Them"}: ${
            m.text
          }`
      )
      .join("\n");

    /* ——— FIRST try free Hugging Face ——— */
    const hfSummary = await summariseWithHF(transcript);
    if (hfSummary) return res.status(200).json({ summary: hfSummary });

    /* ——— Fallback: stitch last 6 messages ——— */
    const quick = transcript.split("\n").slice(-6).join(" ");
    return res.status(200).json({ summary: quick });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

/* -------------------------  (rest of file unchanged)  ---------------------- */
/* Keep sendMessage, markMessagesAsRead, reactToMessage exactly as before...  */

/* -------------------------------------------------------------------------- */
/*                              SEND A MESSAGE                                */
/* -------------------------------------------------------------------------- */
export const sendMessage = async (req, res) => {
  try {
    const { text, image, document, voiceMessage } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    let imageUrl, documentData, voiceMessageData;

    /* optional uploads */
    if (image) {
      const up = await cloudinary.uploader.upload(image);
      imageUrl = up.secure_url;
    }

    if (document) {
      const up = await cloudinary.uploader.upload(document.data, {
        resource_type: "auto",
        folder: "chat_documents",
        public_id: `${Date.now()}_${document.name}`,
      });
      documentData = {
        url: up.secure_url,
        name: document.name,
        type: document.type,
        size: document.size,
      };
    }

    if (voiceMessage?.data) {
      const up = await cloudinary.uploader.upload(voiceMessage.data, {
        resource_type: "auto",
        folder: "voice_messages",
        public_id: `voice_${Date.now()}`,
      });
      voiceMessageData = {
        url: up.secure_url,
        duration: voiceMessage.duration || 0,
      };
    }

    const newMsg = await Message.create({
      senderId,
      receiverId,
      text,
      image: imageUrl,
      document: documentData,
      voiceMessage: voiceMessageData,
    });

    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) io.to(receiverSocketId).emit("newMessage", newMsg);

    return res.status(201).json(newMsg);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

/* -------------------------------------------------------------------------- */
/*                         MARK MESSAGES AS READ                              */
/* -------------------------------------------------------------------------- */
export const markMessagesAsRead = async (req, res) => {
  try {
    const { id: senderId } = req.params;
    const receiverId = req.user._id;

    const updated = await Message.updateMany(
      { senderId, receiverId, read: false },
      { read: true }
    );

    const senderSocketId = getReceiverSocketId(senderId);
    if (senderSocketId) io.to(senderSocketId).emit("messagesRead", receiverId);

    return res
      .status(200)
      .json({ success: true, modifiedCount: updated.modifiedCount });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

/* -------------------------------------------------------------------------- */
/*                               REACT TO MSG                                 */
/* -------------------------------------------------------------------------- */
export const reactToMessage = async (req, res) => {
  try {
    const { id: messageId } = req.params;
    const { emoji } = req.body;
    const userId = req.user._id;

    if (!emoji) return res.status(400).json({ message: "Emoji is required" });

    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ message: "Message not found" });

    const idx = message.reactions?.findIndex(
      (r) => r.userId.toString() === userId.toString() && r.emoji === emoji
    );

    if (idx >= 0) {
      message.reactions.splice(idx, 1); // remove
    } else {
      message.reactions.push({ emoji, userId }); // add
    }

    await message.save();

    const otherUserId =
      message.senderId.toString() === userId.toString()
        ? message.receiverId
        : message.senderId;

    const receiverSocketId = getReceiverSocketId(otherUserId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("messageReaction", {
        messageId: message._id,
        reaction: idx >= 0 ? null : { emoji, userId },
        removed: idx >= 0,
      });
    }

    return res.status(200).json(message);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
};