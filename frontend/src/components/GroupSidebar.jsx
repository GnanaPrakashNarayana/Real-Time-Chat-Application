// frontend/src/components/GroupSidebar.jsx
import { useEffect, useState } from "react";
import { useGroupStore } from "../store/useGroupStore";
import { Users, Plus } from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import CreateGroupModal from "./modals/CreateGroupModal";

const GroupSidebar = () => {
  const { getGroups, groups, selectedGroup, setSelectedGroup, isLoadingGroups } = useGroupStore();
  const { setSelectedUser } = useChatStore();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    getGroups();
  }, [getGroups]);

  const handleGroupSelect = (group) => {
    setSelectedGroup(group);
    setSelectedUser(null); // Deselect any direct chat
  };

  if (isLoadingGroups) return <SidebarSkeleton />;

  return (
    <aside className="h-full w-20 lg:w-72 border-r border-base-300 flex flex-col transition-all duration-200">
      <div className="border-b border-base-300 w-full p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="size-6" />
            <span className="font-medium hidden lg:block">Groups</span>
          </div>
          
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="btn btn-circle btn-sm btn-ghost"
          >
            <Plus className="size-5" />
          </button>
        </div>
      </div>

      <div className="overflow-y-auto w-full py-3">
        {groups.map((group) => (
          <button
            key={group._id}
            onClick={() => handleGroupSelect(group)}
            className={`
              w-full p-3 flex items-center gap-3
              hover:bg-base-300 transition-colors
              ${selectedGroup?._id === group._id ? "bg-base-300 ring-1 ring-base-300" : ""}
            `}
          >
            <div className="relative mx-auto lg:mx-0">
              <div className="size-12 flex items-center justify-center bg-primary/10 rounded-full overflow-hidden">
                {group.groupPic ? (
                  <img
                    src={group.groupPic}
                    alt={group.name}
                    className="size-12 object-cover"
                  />
                ) : (
                  <Users className="size-6 text-primary" />
                )}
              </div>
            </div>

            {/* Group info - only visible on larger screens */}
            <div className="hidden lg:block text-left min-w-0 flex-1">
              <div className="font-medium truncate">{group.name}</div>
              <div className="text-xs text-zinc-400 truncate">
                {group.members.length} members
              </div>
            </div>
          </button>
        ))}

        {groups.length === 0 && (
          <div className="text-center text-zinc-500 py-4">No groups found</div>
        )}
      </div>
      
      {/* Create Group Modal */}
      <CreateGroupModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
      />
    </aside>
  );
};

export default GroupSidebar;