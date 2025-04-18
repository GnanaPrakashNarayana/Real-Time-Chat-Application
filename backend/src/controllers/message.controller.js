// backend/src/controllers/message.controller.js
import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";
import { summariseWithHF } from "../lib/hfSummarizer.js";

const MAX_CHARS = 2500; // keep prompt short to fit model

/* -------------------------------------------------------------------------- */
/*  SIDEBAR USERS                                                             */
/* -------------------------------------------------------------------------- */
export const getUsersForSidebar = async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user._id } }).select("-password");
    res.status(200).json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

/* -------------------------------------------------------------------------- */
/*  FETCH ALL CHAT MESSAGES                                                   */
/* -------------------------------------------------------------------------- */
export const getMessages = async (req, res) => {
  try {
    const { id: otherId } = req.params;
    const myId = req.user._id;

    const msgs = await Message.find({
      $or: [
        { senderId: myId, receiverId: otherId },
        { senderId: otherId, receiverId: myId },
      ],
    });
    res.status(200).json(msgs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

/* -------------------------------------------------------------------------- */
/*  ✨  CONVERSATION SUMMARY                                                  */
/* -------------------------------------------------------------------------- */
export const getConversationSummary = async (req, res) => {
  try {
    const { id: otherId } = req.params;
    const myId = req.user._id;

    /* latest 40 text messages */
    const msgs = await Message.find({
      $or: [
        { senderId: myId, receiverId: otherId },
        { senderId: otherId, receiverId: myId },
      ],
      text: { $exists: true, $ne: "" },
    })
      .sort({ createdAt: -1 })
      .limit(40);

    if (!msgs.length)
      return res.status(200).json({ summary: "No messages yet to summarise." });

    const transcript = msgs
      .reverse()
      .map(
        (m) =>
          `${m.senderId.toString() === myId.toString() ? "You" : "Them"}: ${m.text}`
      )
      .join(" ")
      .slice(-MAX_CHARS); // keep tail

    /* ---------- Hugging Face ---------- */
    const hfSummary = await summariseWithHF(transcript);
    if (hfSummary) {
      console.log("🪵 HF‑Summary used"); // visible in Render logs
      return res.status(200).json({ summary: hfSummary });
    }

    /* ---------- Fallback ---------- */
    const fallback = transcript.split(/(?<=[.?!])\s+/).slice(-4).join(" ");
    return res.status(200).json({ summary: fallback });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

/* -------------------------------------------------------------------------- */
/*  SEND A MESSAGE  (unchanged)                                               */
/* -------------------------------------------------------------------------- */
export const sendMessage = async (req, res) => {
  try {
    const { text, image, document, voiceMessage } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    let imageUrl, documentData, voiceMessageData;
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
      documentData = { url: up.secure_url, name: document.name, type: document.type, size: document.size };
    }
    if (voiceMessage?.data) {
      const up = await cloudinary.uploader.upload(voiceMessage.data, {
        resource_type: "auto",
        folder: "voice_messages",
        public_id: `voice_${Date.now()}`,
      });
      voiceMessageData = { url: up.secure_url, duration: voiceMessage.duration || 0 };
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

    res.status(201).json(newMsg);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

/* -------------------------------------------------------------------------- */
/*  MARK AS READ / REACT TO MSG  (unchanged)                                  */
/* -------------------------------------------------------------------------- */
export const markMessagesAsRead = async (req, res) => {
  try {
    const { id: senderId } = req.params;
    const receiverId = req.user._id;
    const upd = await Message.updateMany(
      { senderId, receiverId, read: false },
      { read: true }
    );
    const senderSocketId = getReceiverSocketId(senderId);
    if (senderSocketId) io.to(senderSocketId).emit("messagesRead", receiverId);
    res.status(200).json({ success: true, modifiedCount: upd.modifiedCount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const reactToMessage = async (req, res) => {
  try {
    const { id: messageId } = req.params;
    const { emoji } = req.body;
    const userId = req.user._id;
    if (!emoji) return res.status(400).json({ message: "Emoji is required" });

    const msg = await Message.findById(messageId);
    if (!msg) return res.status(404).json({ message: "Message not found" });

    const idx = msg.reactions?.findIndex(
      (r) => r.userId.toString() === userId.toString() && r.emoji === emoji
    );

    if (idx >= 0) msg.reactions.splice(idx, 1);
    else msg.reactions.push({ emoji, userId });

    await msg.save();

    const otherId = msg.senderId.toString() === userId.toString() ? msg.receiverId : msg.senderId;
    const socketId = getReceiverSocketId(otherId);
    if (socketId)
      io.to(socketId).emit("messageReaction", {
        messageId: msg._id,
        reaction: idx >= 0 ? null : { emoji, userId },
        removed: idx >= 0,
      });

    res.status(200).json(msg);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};