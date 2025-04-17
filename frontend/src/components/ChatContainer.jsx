// frontend/src/components/ChatContainer.jsx
import { useChatStore } from "../store/useChatStore";
import { useEffect, useRef, useState } from "react";

import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import MessageReactions from "./MessageReactions";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";
import { Check, CheckCheck, FileText, Download, File } from "lucide-react";

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
            
            <div className="chat-bubble">
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
              {!message.text && !message.image && !message.document && (
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

      <MessageInput />
    </div>
  );
};
export default ChatContainer;