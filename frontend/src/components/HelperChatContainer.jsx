import { useState, useRef, useEffect } from "react";
import { useHelperStore } from "../store/useHelperStore";
import { Send, Bot, Trash2, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const HelperChatContainer = () => {
  const [message, setMessage] = useState("");
  const { messages, isLoading, sendMessage, clearChat } = useHelperStore();
  const messageEndRef = useRef(null);
  const navigate = useNavigate();
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim() || isLoading) return;
    
    const messageText = message;
    setMessage("");
    
    await sendMessage(messageText);
  };
  
  // Format timestamp
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };
  
  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-base-300 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => navigate("/")}
            className="btn btn-ghost btn-circle btn-sm"
          >
            <ArrowLeft className="size-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="avatar">
              <div className="size-10 bg-primary/10 rounded-full flex items-center justify-center">
                <Bot className="size-5 text-primary" />
              </div>
            </div>
            <div>
              <h3 className="font-medium">Helper</h3>
              <p className="text-xs text-base-content/60">Chat Assistant</p>
            </div>
          </div>
        </div>
        <button 
          onClick={clearChat}
          className="btn btn-ghost btn-sm gap-1"
          title="Clear chat history"
        >
          <Trash2 className="size-4" />
          <span className="hidden sm:inline">Clear Chat</span>
        </button>
      </div>
      
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Welcome message if no messages */}
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Bot className="size-8 text-primary" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Meet Helper</h2>
            <p className="text-base-content/70 max-w-md mb-6">
              Your chat assistant for all your questions about the app.
              I can help you learn how to use features and navigate the application!
            </p>
            <div className="flex flex-wrap justify-center gap-2 max-w-md">
              {["How do I create a group?", "What features does this app have?", "Tell me a joke"].map((suggestion) => (
                <button
                  key={suggestion}
                  className="btn btn-sm btn-outline"
                  onClick={() => {
                    setMessage(suggestion);
                    setTimeout(() => handleSubmit({ preventDefault: () => {} }), 100);
                  }}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* Chat messages */}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`chat ${msg.role === "user" ? "chat-end" : "chat-start"}`}
          >
            <div className="chat-image avatar">
              <div className="size-10 rounded-full">
                {msg.role === "user" ? (
                  <div className="bg-primary text-primary-content size-full flex items-center justify-center font-bold">
                    U
                  </div>
                ) : (
                  <div className="bg-primary/10 size-full flex items-center justify-center">
                    <Bot className="size-5 text-primary" />
                  </div>
                )}
              </div>
            </div>
            <div className="chat-header mb-1">
              <time className="text-xs opacity-50">{formatTime(msg.timestamp)}</time>
            </div>
            <div className={`chat-bubble ${msg.isError ? "bg-error/10" : ""}`}>
              {msg.content.split('\n').map((line, i) => (
                <p key={i} className={i > 0 ? 'mt-2' : ''}>{line}</p>
              ))}
            </div>
          </div>
        ))}
        
        {/* Loading indicator */}
        {isLoading && (
          <div className="chat chat-start">
            <div className="chat-image avatar">
              <div className="size-10 rounded-full">
                <div className="bg-primary/10 size-full flex items-center justify-center">
                  <Bot className="size-5 text-primary" />
                </div>
              </div>
            </div>
            <div className="chat-bubble bg-base-200 flex gap-1">
              <span className="typing-dot"></span>
              <span className="typing-dot"></span>
              <span className="typing-dot"></span>
            </div>
          </div>
        )}
        
        <div ref={messageEndRef} />
      </div>
      
      {/* Input area */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-base-300">
        <div className="flex gap-2">
          <input
            type="text"
            className="input input-bordered flex-1"
            placeholder="Type your message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={isLoading}
          />
          <button
            type="submit"
            className="btn btn-primary"
            disabled={!message.trim() || isLoading}
          >
            <Send className="size-5" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default HelperChatContainer;