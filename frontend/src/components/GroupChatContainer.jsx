// frontend/src/components/GroupChatContainer.jsx
import { useEffect, useRef, useState } from "react";
import { useGroupStore } from "../store/useGroupStore";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import MessageReactions from "./MessageReactions";
import GroupHeader from "./GroupHeader";
import GroupMessageInput from "./GroupMessageInput";
import AudioPlayer from "./AudioPlayer";
import PollDisplay from "./polls/PollDisplay";
import SmartReplySuggestions from "./SmartReplySuggestions"; 
import { FileText, Download, AlertTriangle, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";

const GroupChatContainer = () => {
  // Add an error state
  const [renderError, setRenderError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  
  const groupStore = useGroupStore();
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
  } = useGroupStore();
  
  const { authUser } = useAuthStore();
  const messageEndRef = useRef(null);
  
  // Safe getter for typing users
  const getTypingUsers = () => {
    try {
      return getGroupTypingUsers() || [];
    } catch (error) {
      console.error("Error getting typing users:", error);
      return [];
    }
  };
  
  // Get typing users
  const typingUserIds = getTypingUsers();

  // Add error handling for all critical operations
  useEffect(() => {
    try {
      // Verify selectedGroup exists and has required properties
      if (!selectedGroup || !selectedGroup._id) {
        console.error("Invalid selectedGroup:", selectedGroup);
        setRenderError("Selected group information is invalid or incomplete");
        return;
      }
      
      subscribeToGroupMessages();
      
      return () => {
        try {
          unsubscribeFromGroupMessages();
        } catch (cleanupError) {
          console.error("Error unsubscribing from group messages:", cleanupError);
        }
      };
    } catch (error) {
      console.error("Error in GroupChatContainer subscription:", error);
      setRenderError("Failed to connect to chat services. Please try refreshing the page.");
    }
  }, [subscribeToGroupMessages, unsubscribeFromGroupMessages, selectedGroup]);

  useEffect(() => {
    if (messageEndRef.current && groupMessages && Array.isArray(groupMessages)) {
      try {
        messageEndRef.current.scrollIntoView({ behavior: "smooth" });
      } catch (scrollError) {
        console.error("Error scrolling to bottom:", scrollError);
      }
    }
  }, [groupMessages]);

  // Handler for sending a smart reply
  const handleSendSmartReply = (text) => {
    if (!text) return;
    
    try {
      sendGroupMessage({ text });
    } catch (error) {
      console.error("Error sending smart reply:", error);
      toast.error("Failed to send message");
    }
  };

  // Create a safe render function for polls
  const renderPoll = (message) => {
    try {
      if (!message || !message.poll || !message.poll._id) return null;
      
      return (
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
      );
    } catch (error) {
      console.error("Error rendering poll:", error);
      return (
        <div className="p-3 bg-base-200 rounded-lg">
          <p className="text-sm text-error">There was an error displaying this poll</p>
        </div>
      );
    }
  };

  // Safe renderer for voice message
  const renderVoiceMessage = (voiceMessage) => {
    try {
      if (!voiceMessage || !voiceMessage.url) return null;
      
      return (
        <div className="mb-2">
          <AudioPlayer 
            audioUrl={voiceMessage.url} 
            duration={voiceMessage.duration || 0}
          />
        </div>
      );
    } catch (error) {
      console.error("Error rendering voice message:", error);
      return (
        <div className="p-2 bg-base-200 rounded-lg text-xs text-error">
          Voice message unavailable
        </div>
      );
    }
  };

  // Safe renderer for document
  const renderDocument = (document) => {
    try {
      if (!document || !document.name) return null;
      
      return (
        <div className="flex items-center gap-2 p-2 bg-base-200 rounded-lg mb-2">
          <FileText className="size-5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{document.name}</p>
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
              className="btn btn-circle btn-xs"
            >
              <Download className="size-3" />
            </a>
          )}
        </div>
      );
    } catch (error) {
      console.error("Error rendering document:", error);
      return (
        <div className="p-2 bg-base-200 rounded-lg text-xs text-error">
          Document unavailable
        </div>
      );
    }
  };

  // Safe renderer for image
  const renderImage = (image) => {
    try {
      if (!image) return null;
      
      return (
        <img
          src={image}
          alt="Attachment"
          className="sm:max-w-[200px] rounded-md mb-2"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = "/placeholder-image.png";
            console.error("Error loading image:", image);
          }}
        />
      );
    } catch (error) {
      console.error("Error rendering image:", error);
      return (
        <div className="p-2 bg-base-200 rounded-lg text-xs text-error">
          Image unavailable
        </div>
      );
    }
  };

  // Retry function
  const handleRetry = () => {
    setRenderError(null);
    setRetryCount(prev => prev + 1);
    
    try {
      // Resubscribe
      unsubscribeFromGroupMessages();
      subscribeToGroupMessages();
      
      // Refresh messages
      if (selectedGroup && selectedGroup._id) {
        groupStore.getGroupMessages(selectedGroup._id);
      }
    } catch (retryError) {
      console.error("Error during retry:", retryError);
      setRenderError("Failed to reconnect. Please refresh the page.");
    }
  };

  // Add error state rendering
  if (renderError) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 bg-base-100">
        <div className="text-center p-6 bg-base-200 rounded-lg max-w-md">
          <div className="text-error mb-2">
            <AlertTriangle className="mx-auto size-10 mb-2" />
          </div>
          <h3 className="text-lg font-medium mb-2">Something went wrong</h3>
          <p className="mb-4 text-base-content/70">{renderError}</p>
          <div className="flex gap-2 justify-center">
            <button 
              className="btn btn-outline"
              onClick={handleRetry}
            >
              <RefreshCw className="size-4 mr-1" />
              Try Again
            </button>
            <button 
              className="btn btn-primary"
              onClick={() => window.location.reload()}
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoadingMessages) {
    return (
      <div className="flex-1 flex flex-col overflow-auto">
        <GroupHeader />
        <MessageSkeleton />
        <GroupMessageInput />
      </div>
    );
  }

  // Ensure groupMessages is an array
  const safeGroupMessages = Array.isArray(groupMessages) ? groupMessages : [];
  
  return (
    <div className="flex-1 flex flex-col overflow-auto">
      <GroupHeader />

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {safeGroupMessages.length === 0 && (
          <div className="text-center p-4 opacity-70">
            <p>No messages yet. Be the first to send a message!</p>
          </div>
        )}
        
        {safeGroupMessages.map((message, index) => {
          // Skip invalid messages
          if (!message || !message._id) return null;
          
          // Safely get senderId
          const senderId = typeof message.senderId === 'object' 
            ? message.senderId._id 
            : (typeof message.senderId === 'string' ? message.senderId : '');
          
          // Safely get sender name
          const senderName = typeof message.senderId === 'object' 
            ? (message.senderId.fullName || 'Unknown') 
            : 'Unknown';
          
          // Safely get sender profile picture
          const senderPic = typeof message.senderId === 'object' 
            ? (message.senderId.profilePic || '/avatar.png') 
            : '/avatar.png';
          
          // Check if message is from current user
          const isFromCurrentUser = authUser && senderId === authUser._id;
          
          return (
            <div
              key={message._id}
              className={`chat ${isFromCurrentUser ? "chat-end" : "chat-start"}`}
              ref={index === safeGroupMessages.length - 1 ? messageEndRef : null}
            >
              <div className="chat-image avatar">
                <div className="size-10 rounded-full border">
                  <img
                    src={senderPic}
                    alt="profile pic"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "/avatar.png";
                    }}
                  />
                </div>
              </div>
              <div className="chat-header mb-1 flex items-center gap-2">
                <span className="font-medium text-xs">
                  {senderName}
                </span>
                <time className="text-xs opacity-50">
                  {formatMessageTime(message.createdAt || new Date())}
                </time>
              </div>
              <div className="chat-bubble flex flex-col">
                {/* Poll display */}
                {message.poll && (
                  <div className="w-full">
                    {renderPoll(message)}
                  </div>
                )}
              
                {/* Voice message */}
                {message.voiceMessage && renderVoiceMessage(message.voiceMessage)}
              
                {/* Image attachment */}
                {message.image && renderImage(message.image)}
                
                {/* Document display */}
                {message.document && renderDocument(message.document)}
                
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
          );
        })}
        
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
      {Array.isArray(smartReplies) && smartReplies.length > 0 && (
        <SmartReplySuggestions
          suggestions={smartReplies}
          isLoading={isLoadingSmartReplies}
          onSendReply={handleSendSmartReply}
        />
      )}

      <GroupMessageInput />
    </div>
  );
};

export default GroupChatContainer;