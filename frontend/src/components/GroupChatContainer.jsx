// frontend/src/components/GroupChatContainer.jsx
import { useEffect, useRef } from "react";
import { useGroupStore } from "../store/useGroupStore";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import MessageReactions from "./MessageReactions";
import GroupHeader from "./GroupHeader";
import GroupMessageInput from "./GroupMessageInput";

const GroupChatContainer = () => {
  const {
    groupMessages,
    selectedGroup,
    isLoadingMessages,
    getGroupTypingUsers,
    subscribeToGroupMessages,
    unsubscribeFromGroupMessages,
    reactToGroupMessage,
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

  if (isLoadingMessages) {
    return (
      <div className="flex-1 flex flex-col overflow-auto">
        <GroupHeader />
        <MessageSkeleton />
        <GroupMessageInput />
      </div>
    );
  }

  // Get members by ID for showing who read messages
  const getMemberById = (memberId) => {
    return selectedGroup.members.find(m => m._id === memberId);
  };

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
              {message.image && (
                <img
                  src={message.image}
                  alt="Attachment"
                  className="sm:max-w-[200px] rounded-md mb-2"
                />
              )}
              {message.text && <p>{message.text}</p>}
            </div>
            
            {/* Message Reactions */}
            <div className="chat-footer opacity-100">
              <MessageReactions 
                message={message} 
                onReact={reactToGroupMessage}
                isGroup={true}
              />
            </div>
            
            {/* Read by indicators for sent messages */}
            {message.senderId._id === authUser._id && message.readBy.length > 1 && (
              <div className="chat-footer opacity-50 flex flex-wrap gap-1 mt-1">
                <span className="text-xs">Read by:</span>
                <div className="flex -space-x-2">
                  {message.readBy
                    .filter(id => id !== authUser._id)
                    .slice(0, 3)
                    .map(readerId => {
                      const member = getMemberById(readerId);
                      return (
                        <div key={readerId} className="avatar" title={member?.fullName || "User"}>
                          <div className="w-4 h-4 rounded-full ring-1 ring-base-100">
                            <img src={member?.profilePic || "/avatar.png"} />
                          </div>
                        </div>
                      );
                    })}
                  {message.readBy.length > 4 && (
                    <span className="text-xs">+{message.readBy.length - 4}</span>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
        
        {/* Typing indicators */}
        {typingUserIds.length > 0 && (
          <div className="chat chat-start">
            <div className="chat-image avatar">
              <div className="w-6 h-6 rounded-full flex items-center justify-center bg-base-300">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="chat-bubble chat-bubble-primary bg-opacity-50">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <span className="typing-dot"></span>
                  <span className="typing-dot"></span>
                  <span className="typing-dot"></span>
                </div>
                <span className="text-xs">
                  {typingUserIds.length === 1 
                    ? `${getMemberById(typingUserIds[0])?.fullName || 'Someone'} is typing...` 
                    : `${typingUserIds.length} people are typing...`}
                </span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messageEndRef} />
      </div>

      <GroupMessageInput />
    </div>
  );
};

export default GroupChatContainer;