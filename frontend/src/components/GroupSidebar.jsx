import { useEffect, useState } from "react";
import { useGroupStore } from "../store/useGroupStore";
import { Users, Plus, Search } from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import CreateGroupModal from "./modals/CreateGroupModal";

const GroupSidebar = () => {
  const { getGroups, groups, selectedGroup, setSelectedGroup, isLoadingGroups } = useGroupStore();
  const { setSelectedUser } = useChatStore();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    getGroups();
  }, [getGroups]);

  const handleGroupSelect = (group) => {
    setSelectedGroup(group);
    setSelectedUser(null); // Deselect any direct chat
  };

  const filteredGroups = groups
    .filter(group => !searchQuery || group.name.toLowerCase().includes(searchQuery.toLowerCase()));

  if (isLoadingGroups) return <SidebarSkeleton />;

  return (
    <aside className="h-full w-20 lg:w-80 border-r border-base-300/50 flex flex-col bg-base-100 transition-all duration-200">
      <div className="border-b border-base-300/50 w-full p-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="size-5 text-primary" />
              <span className="font-medium hidden lg:block">Groups</span>
            </div>
            
            <button 
              onClick={() => setIsCreateModalOpen(true)}
              className="btn btn-circle btn-sm btn-ghost text-primary"
              title="Create Group"
            >
              <Plus className="size-4" />
            </button>
          </div>
          
          {/* Search Bar - only visible on larger screens */}
          <div className="hidden lg:block relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="size-4 text-base-content/40" />
            </div>
            <input
              type="text"
              placeholder="Search groups..."
              className="input input-sm w-full pl-9 bg-base-200/50"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="overflow-y-auto flex-1 w-full py-2 px-2">
        {filteredGroups.length === 0 ? (
          <div className="text-center text-base-content/40 py-6 px-4">
            {searchQuery ? "No groups match your search" : "No groups found"}
            <button 
              onClick={() => setIsCreateModalOpen(true)}
              className="btn btn-sm btn-outline mt-3 gap-1"
            >
              <Plus className="size-3" /> Create Group
            </button>
          </div>
        ) : (
          filteredGroups.map((group) => (
            <button
              key={group._id}
              onClick={() => handleGroupSelect(group)}
              className={`
                w-full p-3 flex items-center gap-3 rounded-xl transition-all mb-1
                hover:bg-base-200/50
                ${selectedGroup?._id === group._id 
                  ? "bg-primary/10 text-primary" 
                  : ""}
              `}
            >
              <div className="relative mx-auto lg:mx-0">
                <div className="size-12 flex items-center justify-center bg-primary/10 rounded-full overflow-hidden border border-base-300/50">
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
                <div className="text-xs text-base-content/50 truncate">
                  {group.members.length} {group.members.length === 1 ? 'member' : 'members'}
                </div>
              </div>
            </button>
          ))
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