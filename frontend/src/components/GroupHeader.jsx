// frontend/src/components/GroupHeader.jsx
import { useState } from "react";
import { useGroupStore } from "../store/useGroupStore";
import { Info, Users, X, BarChart2 } from "lucide-react";
import GroupInfoModal from "./modals/GroupInfoModal";

const GroupHeader = ({ onShowSummary }) => {
  const { selectedGroup, setSelectedGroup } = useGroupStore();
  const [showInfoModal, setShowInfoModal] = useState(false);

  return (
    <div className="p-2.5 border-b border-base-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Group Avatar */}
          <div className="avatar">
            <div className="size-10 rounded-full relative bg-primary/10 flex items-center justify-center">
              {selectedGroup.groupPic ? (
                <img src={selectedGroup.groupPic} alt={selectedGroup.name} className="size-10 rounded-full" />
              ) : (
                <Users className="size-5 text-primary" />
              )}
            </div>
          </div>

          {/* Group info */}
          <div>
            <h3 className="font-medium">{selectedGroup.name}</h3>
            <p className="text-sm text-base-content/70">
              {selectedGroup.members.length} members
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
          
          {/* Info button */}
          <button 
            onClick={() => setShowInfoModal(true)}
            className="btn btn-ghost btn-circle btn-sm"
            title="Group info"
          >
            <Info className="size-5" />
          </button>
          
          {/* Close button */}
          <button 
            onClick={() => setSelectedGroup(null)}
            className="btn btn-ghost btn-circle btn-sm"
          >
            <X className="size-5" />
          </button>
        </div>
      </div>
      
      {/* Group Info Modal */}
      <GroupInfoModal 
        isOpen={showInfoModal} 
        onClose={() => setShowInfoModal(false)} 
        group={selectedGroup} 
      />
    </div>
  );
};

export default GroupHeader;