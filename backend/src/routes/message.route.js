import express from "express";
import Message from "../models/message.model.js"; // Ensure you have a Message model that includes a 'reactions' field.
const router = express.Router();

// Other message endpoints (send, fetch messages, etc.) here…

// Emoji reaction endpoint
router.post("/:messageId/react", async (req, res) => {
  const { userId, emoji } = req.body;
  try {
    const message = await Message.findById(req.params.messageId);
    if (!message) return res.status(404).json({ error: "Message not found" });
    
    // Ensure the reactions field exists
    if (!message.reactions) {
      message.reactions = [];
    }
    message.reactions.push({ userId, emoji });
    await message.save();

    // Emit a socket event for real-time UI update
    req.app.get("io").emit("message-reaction", {
      messageId: message._id,
      userId,
      emoji,
    });
    res.json(message);
  } catch (error) {
    res.status(500).json({ error: "Failed to add reaction" });
  }
});

export default router;