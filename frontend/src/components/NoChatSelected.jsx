import { MessageSquare } from "lucide-react";

const NoChatSelected = () => {
  return (
    <div className="w-full flex flex-1 flex-col items-center justify-center p-16 bg-base-100">
      <div className="max-w-md text-center space-y-6 animate-fadeIn">
        {/* Icon Display */}
        <div className="flex justify-center mb-6">
          <div className="p-6 rounded-full bg-primary/5">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <MessageSquare className="w-8 h-8 text-primary" />
            </div>
          </div>
        </div>

        {/* Welcome Text */}
        <h2 className="text-2xl font-medium">Welcome to Chatterpillar</h2>
        <p className="text-base-content/60 max-w-sm mx-auto">
          Select a conversation from the sidebar to start chatting. Your messages are end-to-end encrypted and secure.
        </p>
        
        <p className="text-xs text-base-content/40 mt-8">
          Chatterpillar - Secure Messaging
        </p>
      </div>
    </div>
  );
};

export default NoChatSelected;