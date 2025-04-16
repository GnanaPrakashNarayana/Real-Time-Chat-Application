// frontend/src/components/MessageReactions.jsx
import { useState } from "react";
import { Smile } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";

// Common emoji list
const EMOJI_LIST = ["👍", "❤️", "😂", "😮", "😢", "🎉", "👏"];

const MessageReactions = ({ message, onReact, isGroup = false }) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const { authUser } = useAuthStore();
  
  // Group reactions by emoji
  const reactionCounts = message.reactions?.reduce((acc, reaction) => {
    if (!acc[reaction.emoji]) {
      acc[reaction.emoji] = {
        count: 0,
        userIds: []
      };
    }
    acc[reaction.emoji].count += 1;
    acc[reaction.emoji].userIds.push(reaction.userId);
    return acc;
  }, {}) || {};
  
  // Check if current user has reacted with this emoji
  const hasUserReacted = (emoji) => {
    return message.reactions?.some(r => 
      r.userId === authUser._id && r.emoji === emoji
    );
  };
  
  return (
    <div className="relative mt-1">
      {/* Existing reactions */}
      <div className="flex flex-wrap gap-1">
        {Object.entries(reactionCounts).map(([emoji, data]) => (
          <button
            key={emoji}
            onClick={() => onReact(message._id, emoji)}
            className={`
              px-1.5 py-0.5 rounded-full text-xs flex items-center gap-1
              ${hasUserReacted(emoji) 
                ? "bg-primary/20 text-primary" 
                : "bg-base-200 hover:bg-base-300"}
            `}
            title={`${data.count} reactions`}
          >
            <span>{emoji}</span>
            <span>{data.count}</span>
          </button>
        ))}
      </div>
      
      {/* Add reaction button */}
      <div className="inline-block ml-1">
        <button
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="text-base-content/50 hover:text-base-content transition-colors"
        >
          <Smile className="size-4" />
        </button>
        
        {/* Emoji picker popup */}
        {showEmojiPicker && (
          <div 
            className="absolute z-10 bg-base-200 rounded-lg shadow-lg p-2 flex gap-1 mt-1"
            onMouseLeave={() => setShowEmojiPicker(false)}
          >
            {EMOJI_LIST.map(emoji => (
              <button
                key={emoji}
                onClick={() => {
                  onReact(message._id, emoji);
                  setShowEmojiPicker(false);
                }}
                className="w-8 h-8 flex items-center justify-center hover:bg-base-300 rounded-full"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageReactions;