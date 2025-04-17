// frontend/src/components/ChatContainer.jsx
import { useChatStore } from "../store/useChatStore";
import { useEffect, useRef } from "react";

import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import MessageReactions from "./MessageReactions";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";
import { Check, CheckCheck, FileText, Download } from "lucide-react";

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
  } = useChatStore();
  const { authUser } = useAuthStore();
  const messageEndRef = useRef(null);

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

  if (isMessagesLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-auto">
        <ChatHeader />
        <MessageSkeleton />
        <MessageInput />
      </div>
    );
  }

  const isTyping = typingUsers[selectedUser._id];

  return (
    <div className="flex-1 flex flex-col overflow-auto">
      <ChatHeader />

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={message._id}
            className={`chat ${message.senderId === authUser._id ? "chat-end" : "chat-start"}`}
            ref={index === messages.length - 1 ? messageEndRef : null}
          >
            <div className="chat-image avatar">
              <div className="size-10 rounded-full border">
                <img
                  src={
                    message.senderId === authUser._id
                      ? authUser.profilePic || "/avatar.png"
                      : selectedUser.profilePic || "/avatar.png"
                  }
                  alt="profile pic"
                />
              </div>
            </div>
            <div className="chat-header mb-1 flex items-center">
              <time className="text-xs opacity-50 ml-1">
                {formatMessageTime(message.createdAt)}
              </time>
              
              {/* Show read status for sent messages */}
              {message.senderId === authUser._id && (
                <span className="ml-1">
                  {message.read ? (
                    <CheckCheck size={14} className="text-blue-500" />
                  ) : (
                    <Check size={14} className="text-gray-500" />
                  )}
                </span>
              )}
            </div>
            <div className="chat-bubble flex flex-col">
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
                    <p className="text-sm font-medium truncate">{message.document.name || "Document"}</p>
                    <p className="text-xs opacity-70">
                      {message.document.size ? ((message.document.size / 1024).toFixed(2) + " KB") : "Unknown size"}
                    </p>
                  </div>
                  {message.document.url && (
                    <a 
                      href={message.document.url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      download={message.document.name}
                      className="btn btn-circle btn-xs"
                    >
                      <Download className="size-3" />
                    </a>
                  )}
                </div>
              )}
              
              {/* Message text content */}
              {message.text && <p>{message.text}</p>}
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

      <MessageInput />
    </div>
  );
};
export default ChatContainer;