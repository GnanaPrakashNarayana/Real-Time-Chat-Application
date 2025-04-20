// frontend/src/components/ChatHeader.jsx
import { X, BarChart2 } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";

const ChatHeader = ({ onShowSummary }) => {
  const { selectedUser, setSelectedUser } = useChatStore();
  const { onlineUsers } = useAuthStore();

  return (
    <div className="p-2.5 border-b border-base-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="avatar">
            <div className="size-10 rounded-full relative">
              <img src={selectedUser.profilePic || "/avatar.png"} alt={selectedUser.fullName} />
            </div>
          </div>

          {/* User info */}
          <div>
            <h3 className="font-medium">{selectedUser.fullName}</h3>
            <p className="text-sm text-base-content/70">
              {onlineUsers && onlineUsers.includes(selectedUser._id) ? "Online" : "Offline"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Summary button */}
          <button 
            onClick={onShowSummary}
            className="btn btn-ghost btn-circle btn-sm"
            title="Conversation Summary"
          >
            <BarChart2 className="size-5" />
          </button>
          
          {/* Close button */}
          <button onClick={() => setSelectedUser(null)} className="btn btn-ghost btn-circle btn-sm">
            <X className="size-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
export default ChatHeader;