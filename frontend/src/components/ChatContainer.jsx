// frontend/src/components/ChatContainer.jsx
import { useChatStore } from "../store/useChatStore";
import { useEffect, useRef, useState } from "react";

import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import MessageReactions from "./MessageReactions";
import AudioPlayer from "./AudioPlayer";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";
import { Check, CheckCheck, FileText, Download, File } from "lucide-react";
import BookmarkButton from "./BookmarkButton"; 
import ConversationSummaryModal from "./modals/ConversationSummaryModal";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import SmartReplySuggestions from "./SmartReplySuggestions";

const ChatContainer = () => {
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
    clearSmartReplies,
    getSmartReplies
  } = useChatStore();
  const { authUser } = useAuthStore();
  const messageEndRef = useRef(null);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [conversationSummary, setConversationSummary] = useState("");
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);

  useEffect(() => {
    getMessages(selectedUser._id);
    subscribeToMessages();
    
    // Mark messages as read when chat is opened
    markMessagesAsRead();
    
    return () => unsubscribeFromMessages();
  }, [selectedUser._id, getMessages, subscribeToMessages, unsubscribeFromMessages, markMessagesAsRead]);

  useEffect(() => {
    if (messageEndRef.current && messages) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
      
      // Mark messages as read when new messages arrive or when scrolled to bottom
      markMessagesAsRead();
    }
  }, [messages, markMessagesAsRead]);

  // Handle sending a smart reply
  const handleSendSmartReply = (text) => {
    if (!text || typeof text !== 'string') return;
    
    try {
      sendMessage({ text });
      clearSmartReplies();
    } catch (error) {
      console.error("Error sending smart reply:", error);
      toast.error("Failed to send message");
    }
  };

  // Function to fetch conversation summary
  const fetchConversationSummary = async () => {
    if (!selectedUser) return;
    
    setIsLoadingSummary(true);
    
    try {
      const res = await axiosInstance.get(`/messages/summary/${selectedUser._id}`);
      setConversationSummary(res.data.summary || "No conversation summary available");
    } catch (error) {
      console.error("Error fetching conversation summary:", error);
      toast.error("Failed to generate conversation summary");
      setConversationSummary("Sorry, we couldn't generate a summary at this time.");
    } finally {
      setIsLoadingSummary(false);
    }
  };
  
  // When summary modal is opened, fetch the summary
  const handleShowSummary = () => {
    setShowSummaryModal(true);
    fetchConversationSummary();
  };

  // Helper function to safely render document bubbles
  const renderDocumentBubble = (document) => {
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
  };

  if (isMessagesLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-auto">
        <ChatHeader onShowSummary={handleShowSummary} />
        <MessageSkeleton />
        <MessageInput />
      </div>
    );
  }

  const isTyping = typingUsers[selectedUser._id];

  useEffect(() => {
    // Only try to get smart replies if there are messages and the last one is from the other person
    if (!messages || !Array.isArray(messages) || messages.length === 0) return;
    
    try {
      const lastMessage = messages[messages.length - 1];
      // Check if last message is from the other person and has text
      if (
        lastMessage && 
        lastMessage.text && 
        typeof lastMessage.text === 'string' &&
        (typeof lastMessage.senderId === 'object' 
          ? lastMessage.senderId?._id !== authUser?._id 
          : lastMessage.senderId !== authUser?._id)
      ) {
        // Get smart replies for the last message
        if (typeof getSmartReplies === 'function') {
          getSmartReplies(lastMessage.text);
        }
      }
    } catch (error) {
      console.error("Error handling smart replies:", error);
    }
  }, [messages, authUser?._id, getSmartReplies]);

  return (
    <div className="flex-1 flex flex-col overflow-auto">
      <ChatHeader onShowSummary={handleShowSummary} />

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            id={`message-${message._id}`}
            key={message._id}
            className={`chat ${
              // Handle cases where senderId might be an object or string
              (typeof message.senderId === 'object' ? message.senderId._id : message.senderId) === authUser._id ||
              // Also mark messages as outgoing if they were scheduled by the current user
              message._schedulerSent === true
                ? "chat-end" 
                : "chat-start"
            }`}
            ref={index === messages.length - 1 ? messageEndRef : null}
          >
            <div className="chat-image avatar">
              <div className="size-10 rounded-full border">
                <img
                  src={
                    (typeof message.senderId === 'object' ? message.senderId._id : message.senderId) === authUser._id
                      ? authUser.profilePic || "/avatar.png"
                      : selectedUser.profilePic || "/avatar.png"
                  }
                  alt="profile pic"
                />
              </div>
            </div>
            
            <div className="chat-header">
              <div className="chat-header-content">
                <time className="chat-timestamp">
                  {formatMessageTime(message.createdAt)}
                </time>
                
                {/* Show read status for sent messages */}
                {(typeof message.senderId === 'object' ? message.senderId._id : message.senderId) === authUser._id && (
                  <span>
                    {message.read ? (
                      <CheckCheck size={14} className="text-blue-500" />
                    ) : (
                      <Check size={14} className="text-gray-500" />
                    )}
                  </span>
                )}
                
                {/* Add BookmarkButton */}
                <BookmarkButton 
                  message={message} 
                  conversationId={selectedUser._id}
                  conversationType="User"
                  small={true}
                />
              </div>
            </div>
            
            <div className="chat-bubble">
              {/* Bookmark indicator at the top of the bubble */}
              <div className="absolute -top-2 left-2">
                <BookmarkButton 
                  message={message} 
                  conversationId={selectedUser._id}
                  conversationType="User"
                  showBookmarked={true}
                  small={true}
                />
              </div>
              
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
        ))}
        
        {/* Typing indicator */}
        {isTyping && (
          <div className="chat chat-start">
            <div className="chat-image avatar">
              <div className="size-10 rounded-full border">
                <img
                  src={selectedUser.profilePic || "/avatar.png"}
                  alt="profile pic"
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

      {/* Add Smart Reply suggestions */}
      {Array.isArray(smartReplies) && smartReplies.length > 0 && (
        <SmartReplySuggestions 
          suggestions={smartReplies} 
          onSendReply={handleSendSmartReply}
          isLoading={isLoadingSmartReplies}
        />
      )}

      <MessageInput />
      
      {/* Conversation Summary Modal */}
      <ConversationSummaryModal
        isOpen={showSummaryModal}
        onClose={() => setShowSummaryModal(false)}
        messages={messages}
        otherUser={selectedUser}
        isLoading={isLoadingSummary}
        summary={conversationSummary}
      />
    </div>
  );
};
export default ChatContainer;