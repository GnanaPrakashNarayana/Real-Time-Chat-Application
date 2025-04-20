import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import { Search, Users } from "lucide-react";

const Sidebar = () => {
  const { getUsers, users, selectedUser, setSelectedUser, isUsersLoading } = useChatStore();
  const { onlineUsers } = useAuthStore();
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    getUsers();
  }, [getUsers]);

  const filteredUsers = users
    .filter(user => !searchQuery || user.fullName.toLowerCase().includes(searchQuery.toLowerCase()))
    .filter(user => !showOnlineOnly || onlineUsers.includes(user._id));

  if (isUsersLoading) return <SidebarSkeleton />;

  return (
    <aside className="h-full w-20 lg:w-80 border-r border-base-300/50 flex flex-col bg-base-100 transition-all duration-200">
      <div className="border-b border-base-300/50 w-full p-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Users className="size-5 text-primary" />
            <span className="font-medium hidden lg:block">Contacts</span>
          </div>
          
          {/* Search Bar - only visible on larger screens */}
          <div className="hidden lg:block relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="size-4 text-base-content/40" />
            </div>
            <input
              type="text"
              placeholder="Search contacts..."
              className="input input-sm w-full pl-9 bg-base-200/50"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          
          {/* Online filter toggle */}
          <div className="hidden lg:flex items-center">
            <label className="cursor-pointer flex items-center gap-2">
              <input
                type="checkbox"
                checked={showOnlineOnly}
                onChange={(e) => setShowOnlineOnly(e.target.checked)}
                className="checkbox checkbox-sm checkbox-primary"
              />
              <span className="text-sm">Show online only</span>
            </label>
            <span className="text-xs text-base-content/40 ml-2">
              {onlineUsers && onlineUsers.length > 0 ? `(${onlineUsers.length} online)` : "(0 online)"}
            </span>
          </div>
        </div>
      </div>

      <div className="overflow-y-auto flex-1 w-full py-2 px-2">
        {filteredUsers.length === 0 ? (
          <div className="text-center text-base-content/40 py-6 px-4">
            {searchQuery ? "No contacts match your search" : (showOnlineOnly ? "No online contacts" : "No contacts found")}
          </div>
        ) : (
          filteredUsers.map((user) => (
            <button
              key={user._id}
              onClick={() => setSelectedUser(user)}
              className={`
                w-full p-3 flex items-center gap-3 rounded-xl transition-all mb-1
                hover:bg-base-200/50
                ${selectedUser?._id === user._id 
                  ? "bg-primary/10 text-primary" 
                  : ""}
              `}
            >
              <div className="relative mx-auto lg:mx-0">
                <img
                  src={user.profilePic || "/avatar.png"}
                  alt={user.fullName}
                  className="size-12 object-cover rounded-full border border-base-300/50"
                />
                {onlineUsers && onlineUsers.includes(user._id) && (
                  <span
                    className="absolute bottom-0 right-0 size-3 bg-success 
                    rounded-full ring-2 ring-base-100"
                  />
                )}
              </div>

              {/* User info - only visible on larger screens */}
              <div className="hidden lg:block text-left min-w-0 flex-1">
                <div className="font-medium truncate">{user.fullName}</div>
                <div className="text-sm text-base-content/50">
                  {onlineUsers.includes(user._id) ? "Online" : "Offline"}
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </aside>
  );
};

export default Sidebar;