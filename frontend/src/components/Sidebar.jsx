import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import { Users } from "lucide-react";

const Sidebar = () => {
  const {
    getUsers,
    users,
    selectedUser,
    setSelectedUser,
    isUsersLoading
  } = useChatStore();

  const { onlineUsers } = useAuthStore();
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);

  useEffect(() => {
    getUsers();
  }, [getUsers]);

  const filteredUsers = showOnlineOnly
    ? users.filter((u) => onlineUsers.includes(u._id))
    : users;

  /* ----------  Helper bot contact  ---------- */
  const helperUser = {
    _id: "helper",
    name: "Helper",
    avatar: "/assets/helper.png",
    isBot: true
  };
  const combinedUsers = [...filteredUsers, helperUser];
  /* ------------------------------------------ */

  if (isUsersLoading) return <SidebarSkeleton />;

  return (
    <aside className="h-full w-20 lg:w-72 border-r border-base-300 flex flex-col">
      <div className="border-b border-base-300 w-full p-5">
        <div className="flex items-center gap-2">
          <Users className="size-6" />
          <span className="font-medium hidden lg:block">Contacts</span>
        </div>

        {/* online‑only toggle */}
        <div className="mt-3 hidden lg:flex items-center gap-2">
          <label className="cursor-pointer flex items-center gap-2">
            <input
              type="checkbox"
              checked={showOnlineOnly}
              onChange={(e) => setShowOnlineOnly(e.target.checked)}
              className="checkbox checkbox-sm"
            />
            <span className="text-sm">Show online only</span>
          </label>
          <span className="text-xs text-zinc-500">
            {onlineUsers?.length ? `(${onlineUsers.length} online)` : "(0 online)"}
          </span>
        </div>
      </div>

      {/* -------- list -------- */}
      <div className="overflow-y-auto w-full py-3">
        {combinedUsers.map((user) => (
          <button
            key={user._id}
            onClick={() => setSelectedUser(user)}
            className={`w-full p-3 flex items-center gap-3 hover:bg-base-300 transition-colors ${
              selectedUser?._id === user._id ? "bg-base-300 ring-1 ring-base-300" : ""
            }`}
          >
            <div className="avatar">
              <div className="w-10 rounded-full">
                <img src={user.avatar} />
              </div>
            </div>
            <span className="hidden lg:block truncate flex-1 text-left">
              {user.name}
            </span>
          </button>
        ))}

        {combinedUsers.length === 0 && (
          <div className="text-center text-zinc-500 py-4">No contacts</div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
