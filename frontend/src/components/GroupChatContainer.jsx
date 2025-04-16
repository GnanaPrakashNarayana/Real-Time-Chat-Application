import { useEffect, useRef } from "react";
import { useGroupStore } from "../store/useGroupStore";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import MessageReactions from "./MessageReactions";
import GroupHeader from "./GroupHeader";
import GroupMessageInput from "./GroupMessageInput";
import { FileText, Download } from "lucide-react"; // Import icons

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
              
              {message.text && <p>{message.text}</p>}
            </div>
            
            {/* ... existing code for reactions and read indicators */}
          </div>
        ))}
        
        {/* ... existing code for typing indicators */}
        
        <div ref={messageEndRef} />
      </div>

      <GroupMessageInput />
    </div>
  );
};

export default GroupChatContainer;