import { useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useGroupStore } from "../store/useGroupStore";

import Sidebar from "../components/Sidebar";
import GroupSidebar from "../components/GroupSidebar";
import NoChatSelected from "../components/NoChatSelected";
import ChatContainer from "../components/ChatContainer";
import GroupChatContainer from "../components/GroupChatContainer";
import { MessageSquare, Users } from "lucide-react";

import ErrorBoundary from "../components/ErrorBoundary";

const HomePage = () => {
  const { selectedUser } = useChatStore();
  const { selectedGroup } = useGroupStore();
  const [activeTab, setActiveTab] = useState("direct"); // "direct" or "groups"

  return (
    <div className="min-h-screen bg-base-200/50">
      <div className="flex items-center justify-center pt-20 px-4 pb-4">
        <div className="bg-base-100 rounded-2xl shadow-apple-md w-full max-w-7xl h-[calc(100vh-6rem)] overflow-hidden">
          {/* Tab Navigation */}
          <div className="border-b border-base-300/50 flex">
            <button
              className={`flex-1 py-4 px-4 flex items-center justify-center gap-2 transition-all
                ${activeTab === "direct" 
                  ? "border-b-2 border-primary text-primary font-medium" 
                  : "text-base-content/70 hover:text-base-content hover:bg-base-200/30"
                }
              `}
              onClick={() => setActiveTab("direct")}
            >
              <MessageSquare className="size-5" />
              <span className="font-medium">Direct Messages</span>
            </button>
            <button
              className={`flex-1 py-4 px-4 flex items-center justify-center gap-2 transition-all
                ${activeTab === "groups" 
                  ? "border-b-2 border-primary text-primary font-medium" 
                  : "text-base-content/70 hover:text-base-content hover:bg-base-200/30"
                }
              `}
              onClick={() => setActiveTab("groups")}
            >
              <Users className="size-5" />
              <span className="font-medium">Group Chats</span>
            </button>
          </div>
          
          <div className="flex h-[calc(100%-4rem)] overflow-hidden">
            <ErrorBoundary>
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
            </ErrorBoundary>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;