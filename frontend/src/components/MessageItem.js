import React from "react";
import axios from "axios";
import { useAuthStore } from "../stores/useAuthStore";

const MessageItem = ({ message, currentUser }) => {
  // Function to send an emoji reaction
  const addReaction = async (emoji) => {
    try {
      const res = await axios.post(`/api/messages/${message._id}/react`, {
        userId: currentUser._id,
        emoji: emoji,
      });
      console.log("Reaction added", res.data);
      // You may update state here if not handled by socket event.
    } catch (error) {
      console.error("Failed to add reaction", error);
    }
  };

  return (
    <div className="message-item">
      <p>{message.text}</p>
      <div className="reactions">
        {message.reactions && message.reactions.map((r, index) => (
          <span key={index}>{r.emoji}</span>
        ))}
      </div>
      {/* Simple reaction button; for a full implementation, integrate an emoji picker */}
      <button onClick={() => addReaction("👍")}>React 👍</button>
    </div>
  );
};

export default MessageItem;