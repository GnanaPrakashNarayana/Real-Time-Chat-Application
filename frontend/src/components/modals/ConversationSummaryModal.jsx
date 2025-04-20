// frontend/src/components/modals/ConversationSummaryModal.jsx
import { useState, useEffect } from "react";
import { X, RefreshCw } from "lucide-react";
import { useAuthStore } from "../../store/useAuthStore";

const ConversationSummaryModal = ({ isOpen, onClose, messages, otherUser }) => {
  const [summary, setSummary] = useState("");
  const [isRegenerating, setIsRegenerating] = useState(false);
  const { authUser } = useAuthStore();
  
  useEffect(() => {
    if (isOpen && messages && messages.length > 0) {
      generateSummary(messages, authUser, otherUser);
    }
  }, [isOpen, messages, authUser, otherUser]);
  
  const generateSummary = (messages, authUser, otherUser) => {
    setIsRegenerating(true);
    
    try {
      // Get the most recent messages (last 20 at most)
      const recentMessages = messages.slice(-20);
      
      // Extract conversation patterns
      const hasGreetings = recentMessages.some(msg => 
        msg.text?.toLowerCase().includes("hi") || 
        msg.text?.toLowerCase().includes("hello") || 
        msg.text?.toLowerCase().includes("hey")
      );
      
      const hasWellbeingQuestions = recentMessages.some(msg => 
        msg.text?.toLowerCase().includes("how are you") || 
        msg.text?.toLowerCase().includes("how's it going") || 
        msg.text?.toLowerCase().includes("what's up")
      );
      
      const hasPositiveResponses = recentMessages.some(msg => 
        msg.text?.toLowerCase().includes("good") || 
        msg.text?.toLowerCase().includes("great") || 
        msg.text?.toLowerCase().includes("fine") || 
        msg.text?.toLowerCase().includes("well")
      );

      // Extract topics from conversation
      const topicKeywords = {
        work: ["work", "job", "project", "meeting", "deadline", "boss", "colleague"],
        family: ["family", "mom", "dad", "sister", "brother", "parent", "child"],
        plans: ["plan", "weekend", "trip", "vacation", "visit", "tomorrow", "later"],
        food: ["eat", "food", "lunch", "dinner", "breakfast", "restaurant", "recipe"],
        entertainment: ["movie", "show", "watch", "game", "play", "music", "concert"]
      };
      
      const detectedTopics = [];
      
      Object.entries(topicKeywords).forEach(([topic, keywords]) => {
        const topicMentioned = keywords.some(keyword => 
          recentMessages.some(msg => msg.text?.toLowerCase().includes(keyword))
        );
        
        if (topicMentioned) {
          detectedTopics.push(topic);
        }
      });
      
      // Build the summary
      let summaryText = "";
      const yourName = "You";
      const theirName = otherUser?.fullName || "Them";
      
      if (hasGreetings) {
        summaryText += `${yourName} and ${theirName} exchanged greetings. `;
      }
      
      if (hasWellbeingQuestions) {
        summaryText += `There was a check-in about how each other was doing. `;
      }
      
      if (hasPositiveResponses) {
        summaryText += `The conversation had a positive tone. `;
      }
      
      if (detectedTopics.length > 0) {
        summaryText += `Topics discussed included ${detectedTopics.join(", ")}. `;
      }
      
      // Add conversation stats
      const yourMessageCount = recentMessages.filter(msg => 
        msg.senderId === authUser._id
      ).length;
      
      const theirMessageCount = recentMessages.length - yourMessageCount;
      
      summaryText += `In this conversation, ${yourName} sent ${yourMessageCount} messages and ${theirName} sent ${theirMessageCount} messages.`;
      
      // If we couldn't generate a meaningful summary, use a generic one
      if (summaryText.trim() === "") {
        summaryText = `This is a conversation between ${yourName} and ${theirName} with ${recentMessages.length} messages in total.`;
      }
      
      setSummary(summaryText);
    } catch (error) {
      console.error("Error generating summary:", error);
      setSummary("Could not generate conversation summary due to an error.");
    } finally {
      setIsRegenerating(false);
    }
  };
  
  const handleRegenerate = () => {
    generateSummary(messages, authUser, otherUser);
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-base-100 rounded-lg shadow-xl w-full max-w-md">
        <div className="p-4 border-b border-base-300 flex justify-between items-center">
          <h3 className="text-lg font-semibold">Conversation Summary</h3>
          <button onClick={onClose} className="btn btn-ghost btn-circle btn-sm">
            <X className="size-5" />
          </button>
        </div>
        
        <div className="p-6">
          <p className="text-base-content">{summary}</p>
        </div>
        
        <div className="p-4 border-t border-base-300 flex justify-between">
          <button 
            onClick={handleRegenerate}
            className="btn btn-ghost btn-sm gap-2"
            disabled={isRegenerating}
          >
            <RefreshCw className={`size-4 ${isRegenerating ? 'animate-spin' : ''}`} />
            Regenerate
          </button>
          
          <button onClick={onClose} className="btn btn-primary btn-sm">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConversationSummaryModal;