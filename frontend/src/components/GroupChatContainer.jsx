// frontend/src/components/GroupChatContainer.jsx
import { useEffect, useRef } from "react";
import { useGroupStore } from "../store/useGroupStore";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import MessageReactions from "./MessageReactions";
import GroupHeader from "./GroupHeader";
import GroupMessageInput from "./GroupMessageInput";
import AudioPlayer from "./AudioPlayer";
import PollDisplay from "./polls/PollDisplay";
import SmartReplySuggestions from "./SmartReplySuggestions"; // Import the new component
import { FileText, Download } from "lucide-react";

const GroupChatContainer = () => {
  const {
    groupMessages,
    selectedGroup,
    isLoadingMessages,
    getGroupTypingUsers,
    subscribeToGroupMessages,
    unsubscribeFromGroupMessages,
    reactToGroupMessage,
    sendGroupMessage,
    smartReplies,
    isLoadingSmartReplies,
    getSmartReplies,
  } = useGroupStore();
  
  const { authUser } = useAuthStore();
  const messageEndRef = useRef(null);
  
  // Get typing users
  const typingUserIds = getGroupTypingUsers();

  useEffect(() => {
    subscribeToGroupMessages();
    return () => unsubscribeFromGroupMessages();
  }, [subscribeToGroupMessages, unsubscribeFromGroupMessages]);

  useEffect(() => {
    if (messageEndRef.current && groupMessages) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [groupMessages]);

  // Find the last message from other users to generate smart replies
  useEffect(() => {
    if (groupMessages && groupMessages.length > 0) {
      // Get the last message from another person
      const lastOtherUserMessage = [...groupMessages]
        .reverse()
        .find(msg => msg.senderId._id !== authUser._id);
        
      // If we found a message and it has text, generate smart replies
      if (lastOtherUserMessage?.text) {
        getSmartReplies(lastOtherUserMessage.text);
      }
    }
  }, [groupMessages, authUser._id, getSmartReplies]);

  // Handler for sending a smart reply
  const handleSendSmartReply = (text) => {
    if (!text) return;
    
    sendGroupMessage({ text });
  };

  if (isLoadingMessages) {
    return (
      <div className="flex-1 flex flex-col overflow-auto">
        <GroupHeader />
        <MessageSkeleton />
        <GroupMessageInput />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-auto">
      <GroupHeader />

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {groupMessages.map((message, index) => (
          <div
            key={message._id}
            className={`chat ${message.senderId._id === authUser._id ? "chat-end" : "chat-start"}`}
            ref={index === groupMessages.length - 1 ? messageEndRef : null}
          >
            <div className="chat-image avatar">
              <div className="size-10 rounded-full border">
                <img
                  src={message.senderId.profilePic || "/avatar.png"}
                  alt="profile pic"
                />
              </div>
            </div>
            <div className="chat-header mb-1 flex items-center gap-2">
              <span className="font-medium text-xs">
                {message.senderId.fullName}
              </span>
              <time className="text-xs opacity-50">
                {formatMessageTime(message.createdAt)}
              </time>
            </div>
            <div className="chat-bubble flex flex-col">

              {/* Poll display */}
              {message.poll && (
                <div className="w-full">
                  <PollDisplay 
                    poll={{
                      ...message.poll,
                      options: Array.isArray(message.poll.options) ? message.poll.options : [],
                      creator: message.poll.creator || { _id: "", fullName: "Unknown", profilePic: "" },
                      isActive: message.poll.isActive !== false
                    }}
                    messageId={message._id}
                    key={`poll-${message.poll._id}-${Date.now()}`}
                  />
                </div>
              )}
            
              {/* Voice message */}
              {message.voiceMessage && message.voiceMessage.url && (
                <div className="mb-2">
                  <AudioPlayer 
                    audioUrl={message.voiceMessage.url} 
                    duration={message.voiceMessage.duration}
                  />
                </div>
              )}
            
              {/* Image attachment */}
              {message.image && (
                <img
                  src={message.image}
                  alt="Attachment"
                  className="sm:max-w-[200px] rounded-md mb-2"
                />
              )}
              
              {/* Document display */}
              {message.document && (
                <div className="flex items-center gap-2 p-2 bg-base-200 rounded-lg mb-2">
                  <FileText className="size-5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{message.document.name}</p>
                    <p className="text-xs opacity-70">
                      {(message.document.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                  <a 
                    href={message.document.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    download={message.document.name}
                    className="btn btn-circle btn-xs"
                  >
                    <Download className="size-3" />
                  </a>
                </div>
              )}
              
              {/* Regular text message content - don't show if it's just the poll text */}
              {message.text && !message.poll && <p>{message.text}</p>}
              
              {/* Fallback for empty messages */}
              {!message.text && !message.image && !message.document && !message.voiceMessage && !message.poll && (
                <p className="text-xs italic opacity-50">Attachment</p>
              )}
            </div>
            
            {/* Message Reactions */}
            <div className="chat-footer opacity-100">
              <MessageReactions 
                message={message} 
                onReact={(messageId, emoji) => reactToGroupMessage(messageId, emoji)}
                isGroup={true}
              />
            </div>
          </div>
        ))}
        
        {/* Typing indicators */}
        {typingUserIds.length > 0 && (
          <div className="chat chat-start">
            <div className="chat-image avatar">
              <div className="size-10 rounded-full border bg-primary/10 flex items-center justify-center">
                <span className="text-xs font-bold">{typingUserIds.length}</span>
              </div>
            </div>
            <div className="chat-bubble chat-bubble-primary bg-opacity-50 flex gap-1">
              <span className="typing-dot"></span>
              <span className="typing-dot"></span>
              <span className="typing-dot"></span>
            </div>
          </div>
        )}
        
        <div ref={messageEndRef} />
      </div>

      {/* Smart Reply Suggestions */}
      <SmartReplySuggestions
        suggestions={smartReplies}
        isLoading={isLoadingSmartReplies}
        onSendReply={handleSendSmartReply}
      />

      <GroupMessageInput />
    </div>
  );
};

export default GroupChatContainer;