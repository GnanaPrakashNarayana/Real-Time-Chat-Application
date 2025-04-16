// frontend/src/pages/HomePage.jsx
import { useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useGroupStore } from "../store/useGroupStore";

import Sidebar from "../components/Sidebar";
import GroupSidebar from "../components/GroupSidebar";
import NoChatSelected from "../components/NoChatSelected";
import ChatContainer from "../components/ChatContainer";
import GroupChatContainer from "../components/GroupChatContainer";
import { MessageSquare, Users } from "lucide-react";

const HomePage = () => {
  const { selectedUser } = useChatStore();
  const { selectedGroup } = useGroupStore();
  const [activeTab, setActiveTab] = useState("direct"); // "direct" or "groups"

  return (
    <div className="h-screen bg-base-200">
      <div className="flex items-center justify-center pt-20 px-4">
        <div className="bg-base-100 rounded-lg shadow-cl w-full max-w-6xl h-[calc(100vh-8rem)]">
          {/* Tab Navigation */}
          <div className="border-b border-base-300 flex">
            <button
              className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 transition-colors
                ${activeTab === "direct" ? "border-b-2 border-primary text-primary" : "hover:bg-base-200"}
              `}
              onClick={() => setActiveTab("direct")}
            >
              <MessageSquare className="size-5" />
              <span className="font-medium">Direct Messages</span>
            </button>
            <button
              className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 transition-colors
                ${activeTab === "groups" ? "border-b-2 border-primary text-primary" : "hover:bg-base-200"}
              `}
              onClick={() => setActiveTab("groups")}
            >
              <Users className="size-5" />
              <span className="font-medium">Group Chats</span>
            </button>
          </div>
          
          <div className="flex h-[calc(100%-3rem)] rounded-lg overflow-hidden">
            {activeTab === "direct" ? (
              <>
                <Sidebar />
                {!selectedUser ? <NoChatSelected /> : <ChatContainer />}
              </>
            ) : (
              <>
                <GroupSidebar />
                {!selectedGroup ? <NoChatSelected /> : <GroupChatContainer />}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default HomePage;