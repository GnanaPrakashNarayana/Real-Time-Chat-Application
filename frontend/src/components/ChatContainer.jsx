// frontend/src/components/ChatContainer.jsx
import { useChatStore } from "../store/useChatStore";
import { useEffect, useRef, useState, useCallback, memo } from "react";

import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import MessageReactions from "./MessageReactions";
import AudioPlayer from "./AudioPlayer";
import SmartReplySuggestions from "./SmartReplySuggestions"; 
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";
import { Check, CheckCheck, FileText, Download, File } from "lucide-react";

// Performance optimization: memo wrapper to prevent unnecessary re-renders
const ChatContainer = memo(() => {
  const {
    messages,
    getMessages,
    isMessagesLoading,
    selectedUser,
    subscribeToMessages,
    unsubscribeFromMessages,
    markMessagesAsRead,
    typingUsers,
    reactToMessage,
    smartReplies,
    isLoadingSmartReplies,
    sendMessage,
  } = useChatStore();
  
  const { authUser } = useAuthStore();
  const messageEndRef = useRef(null);
  const [error, setError] = useState(null);
  const [lastMessageCount, setLastMessageCount] = useState(0);

  // Prevent infinite loop by tracking message count
  useEffect(() => {
    if (messages?.length !== lastMessageCount) {
      setLastMessageCount(messages?.length || 0);
    }
  }, [messages, lastMessageCount]);

  // Performance optimization: useCallback for functions to prevent recreating on each render
  const scrollToBottom = useCallback(() => {
    if (messageEndRef.current) {
      try {
        messageEndRef.current.scrollIntoView({ behavior: "smooth" });
      } catch (error) {
        console.error("Error scrolling to bottom:", error);
      }
    }
  }, []);

  useEffect(() => {
    try {
      if (!selectedUser || !selectedUser._id) {
        console.error("Selected user is invalid:", selectedUser);
        return;
      }
      
      getMessages(selectedUser._id);
      
      // Add a small delay before subscribing to messages to avoid race conditions
      const subscriptionTimeout = setTimeout(() => {
        try {
          subscribeToMessages();
        } catch (err) {
          console.error("Error subscribing to messages:", err);
          setError("Failed to connect to messaging service");
        }
      }, 300);
      
      return () => {
        clearTimeout(subscriptionTimeout);
        try {
          unsubscribeFromMessages();
        } catch (err) {
          console.error("Error unsubscribing from messages:", err);
        }
      };
    } catch (error) {
      console.error("Error in ChatContainer setup:", error);
      setError("Something went wrong loading the chat");
    }
  }, [selectedUser?._id, getMessages, subscribeToMessages, unsubscribeFromMessages]);

  useEffect(() => {
    if (messageEndRef.current && messages && messages.length > 0) {
      scrollToBottom();
      
      // Add a small delay before marking messages as read to avoid race conditions
      const readTimeout = setTimeout(() => {
        try {
          markMessagesAsRead();
        } catch (err) {
          console.error("Error marking messages as read:", err);
        }
      }, 500);
      
      return () => clearTimeout(readTimeout);
    }
  }, [messages, markMessagesAsRead, scrollToBottom]);

  // Performance optimization: memoize the smart reply generation
  const handleSendSmartReply = useCallback((text) => {
    if (!text) return;
    sendMessage({ text });
  }, [sendMessage]);

  // Safely render document bubbles with error boundary
  const renderDocumentBubble = useCallback((document) => {
    if (!document) return null;
    
    try {
      return (
        <div className="flex items-center gap-2 p-3 bg-base-200 rounded-lg mb-2 w-full">
          <File className="size-5 flex-shrink-0" />
          <div className="flex-1 min-w-0 overflow-hidden">
            <p className="text-sm font-medium truncate max-w-[200px]">
              {document.name || "Untitled Document"}
            </p>
            <p className="text-xs opacity-70">
              {document.size ? `${(document.size / 1024).toFixed(2)} KB` : "Document"}
            </p>
          </div>
          {document.url && (
            <a 
              href={document.url} 
              target="_blank" 
              rel="noopener noreferrer" 
              download={document.name}
              className="btn btn-circle btn-sm flex-shrink-0"
              title="Download"
            >
              <Download className="size-3" />
            </a>
          )}
        </div>
      );
    } catch (error) {
      console.error("Error rendering document:", error);
      return (
        <div className="p-3 bg-base-200 rounded-lg mb-2 text-sm">
          Document attachment
        </div>
      );
    }
  }, []);

  // Show error message if something went wrong
  if (error) {
    return (
      <div className="flex-1 flex flex-col overflow-auto">
        <ChatHeader />
        <div className="flex-1 flex items-center justify-center">
          <div className="p-4 bg-base-200 rounded-lg text-error">
            <p>{error}</p>
            <button 
              className="btn btn-sm btn-outline mt-2"
              onClick={() => window.location.reload()}
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isMessagesLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-auto">
        <ChatHeader />
        <MessageSkeleton />
        <MessageInput />
      </div>
    );
  }

  // Safely access typing status
  const isTyping = typingUsers && typeof typingUsers === 'object' 
    ? typingUsers[selectedUser?._id] 
    : false;

  // Safe check for messages array
  const safeMessages = Array.isArray(messages) ? messages : [];

  return (
    <div className="flex-1 flex flex-col overflow-auto">
      <ChatHeader />

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {safeMessages.length === 0 && (
          <div className="text-center py-8 text-base-content/60">
            <p>No messages yet. Start the conversation!</p>
          </div>
        )}
        
        {safeMessages.map((message, index) => {
          // Skip invalid messages
          if (!message || !message._id) return null;
          
          // Determine if message is from current user
          const isFromCurrentUser = authUser && message.senderId === authUser._id;
          
          return (
            <div
              key={message._id}
              className={`chat ${isFromCurrentUser ? "chat-end" : "chat-start"}`}
              ref={index === safeMessages.length - 1 ? messageEndRef : null}
            >
              <div className="chat-image avatar">
                <div className="size-10 rounded-full border">
                  <img
                    src={
                      isFromCurrentUser
                        ? authUser?.profilePic || "/avatar.png"
                        : selectedUser?.profilePic || "/avatar.png"
                    }
                    alt="profile pic"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "/avatar.png";
                    }}
                  />
                </div>
              </div>
              
              <div className="chat-header mb-1 flex items-center">
                <time className="text-xs opacity-50 ml-1">
                  {formatMessageTime(message.createdAt || new Date())}
                </time>
                
                {/* Show read status for sent messages */}
                {isFromCurrentUser && (
                  <span className="ml-1">
                    {message.read ? (
                      <CheckCheck size={14} className="text-blue-500" />
                    ) : (
                      <Check size={14} className="text-gray-500" />
                    )}
                  </span>
                )}
              </div>
              
              <div className="chat-bubble">
                {/* Voice message */}
                {message.voiceMessage && message.voiceMessage.url && (
                  <div className="mb-2">
                    <AudioPlayer 
                      audioUrl={message.voiceMessage.url} 
                      duration={message.voiceMessage.duration}
                    />
                  </div>
                )}
                
                {/* Document display - with robust error handling */}
                {message.document && renderDocumentBubble(message.document)}
                
                {/* Image attachment */}
                {message.image && (
                  <img
                    src={message.image}
                    alt="Attachment"
                    className="sm:max-w-[200px] rounded-md mb-2"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "/placeholder-image.png";
                      console.error("Error loading image");
                    }}
                  />
                )}
                
                {/* Message text content */}
                {message.text && <p>{message.text}</p>}
                
                {/* Fallback for empty messages */}
                {!message.text && !message.image && !message.document && !message.voiceMessage && (
                  <p className="text-xs italic opacity-50">Attachment</p>
                )}
              </div>
              
              {/* Message Reactions */}
              <div className="chat-footer opacity-100">
                <MessageReactions 
                  message={message} 
                  onReact={reactToMessage}
                />
              </div>
            </div>
          );
        })}
        
        {/* Typing indicator */}
        {isTyping && (
          <div className="chat chat-start">
            <div className="chat-image avatar">
              <div className="size-10 rounded-full border">
                <img
                  src={selectedUser?.profilePic || "/avatar.png"}
                  alt="profile pic"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "/avatar.png";
                  }}
                />
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
      {Array.isArray(smartReplies) && smartReplies.length > 0 && (
        <SmartReplySuggestions
          suggestions={smartReplies}
          isLoading={isLoadingSmartReplies}
          onSendReply={handleSendSmartReply}
        />
      )}

      <MessageInput />
    </div>
  );
});

ChatContainer.displayName = 'ChatContainer';

export default ChatContainer;