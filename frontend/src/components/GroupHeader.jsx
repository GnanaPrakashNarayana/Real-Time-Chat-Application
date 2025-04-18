// frontend/src/components/GroupHeader.jsx
import { useState } from "react";
import { Info, Users, X, AlignLeft } from "lucide-react";
import { useGroupStore } from "../store/useGroupStore";
import GroupInfoModal from "./modals/GroupInfoModal";
import ConversationSummaryModal from "./modals/ConversationSummaryModal";

const GroupHeader = () => {
  const { selectedGroup, setSelectedGroup } = useGroupStore();
  const [showInfo, setShowInfo] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  return (
    <>
      <div className="p-2.5 border-b border-base-300">
        <div className="flex items-center justify-between">
          {/* ——— Group avatar ——— */}
          <div className="flex items-center gap-3">
            <div className="avatar">
              <div className="size-10 rounded-full relative bg-primary/10 flex items-center justify-center">
                {selectedGroup.groupPic ? (
                  <img
                    src={selectedGroup.groupPic}
                    alt={selectedGroup.name}
                    className="size-10 rounded-full"
                  />
                ) : (
                  <Users className="size-5 text-primary" />
                )}
              </div>
            </div>

            <div>
              <h3 className="font-medium">{selectedGroup.name}</h3>
              <p className="text-sm text-base-content/70">
                {selectedGroup.members.length} members
              </p>
            </div>
          </div>

          {/* ——— Action buttons ——— */}
          <div className="flex items-center gap-2">
            {/* Summary */}
            <button
              onClick={() => setShowSummary(true)}
              className="btn btn-ghost btn-circle btn-sm"
              title="Conversation summary"
            >
              <AlignLeft className="size-5" />
            </button>

            {/* Info */}
            <button
              onClick={() => setShowInfo(true)}
              className="btn btn-ghost btn-circle btn-sm"
              title="Group info"
            >
              <Info className="size-5" />
            </button>

            {/* Close */}
            <button
              onClick={() => setSelectedGroup(null)}
              className="btn btn-ghost btn-circle btn-sm"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <GroupInfoModal
        isOpen={showInfo}
        onClose={() => setShowInfo(false)}
        group={selectedGroup}
      />

      <ConversationSummaryModal
        isOpen={showSummary}
        onClose={() => setShowSummary(false)}
        chatId={selectedGroup._id} // backend treats this the same
      />
    </>
  );
};

export default GroupHeader;