import { useState } from "react";
import { X, AlignLeft } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import ConversationSummaryModal from "./modals/ConversationSummaryModal";

const ChatHeader = () => {
  const { selectedUser, setSelectedUser } = useChatStore();
  const { onlineUsers } = useAuthStore();

  /* modal state */
  const [showSummary, setShowSummary] = useState(false);

  return (
    <>
      <div className="p-4 border-b border-base-300/50 bg-base-100/80 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          {/* ——— User info ——— */}
          <div className="flex items-center gap-3">
            <div className="avatar">
              <div className="size-10 rounded-full relative">
                <img
                  src={selectedUser.profilePic || "/avatar.png"}
                  alt={selectedUser.fullName}
                  className="border border-base-300/30"
                />
                {onlineUsers?.includes(selectedUser._id) && (
                  <span className="absolute bottom-0 right-0 size-3 bg-success rounded-full border-2 border-base-100" />
                )}
              </div>
            </div>

            <div>
              <h3 className="font-medium">{selectedUser.fullName}</h3>
              <p className="text-sm text-base-content/60">
                {onlineUsers?.includes(selectedUser._id) ? "Online" : "Offline"}
              </p>
            </div>
          </div>

          {/* ——— Action buttons ——— */}
          <div className="flex items-center gap-2">
            {/* ✨ Summary button */}
            <button
              onClick={() => setShowSummary(true)}
              className="btn btn-ghost btn-circle btn-sm"
              title="Conversation summary"
            >
              <AlignLeft className="size-5" />
            </button>

            {/* Close chat */}
            <button
              onClick={() => setSelectedUser(null)}
              className="btn btn-ghost btn-circle btn-sm text-base-content/60 hover:text-base-content"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal */}
      <ConversationSummaryModal
        isOpen={showSummary}
        onClose={() => setShowSummary(false)}
        chatId={selectedUser._id}
      />
    </>
  );
};

export default ChatHeader;