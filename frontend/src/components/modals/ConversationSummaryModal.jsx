// frontend/src/components/modals/ConversationSummaryModal.jsx
import { useState, useEffect } from "react";
import { X, RefreshCw, BarChart2 } from "lucide-react";
import { useAuthStore } from "../../store/useAuthStore";
import { axiosInstance } from "../../lib/axios";
import toast from "react-hot-toast";

const ConversationSummaryModal = ({ isOpen, onClose, messages, otherUser, isLoading: propIsLoading, summary: propSummary }) => {
  const [summary, setSummary] = useState("");
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { authUser } = useAuthStore();
  
  // Use props if provided, otherwise handle locally
  const isSummaryLoading = propIsLoading !== undefined ? propIsLoading : isLoading;
  
  useEffect(() => {
    if (propSummary !== undefined) {
      setSummary(propSummary);
    } else if (isOpen && messages && messages.length > 0) {
      generateSummary(messages, authUser, otherUser);
    }
  }, [isOpen, messages, authUser, otherUser, propSummary]);
  
  const generateSummary = async (messages, authUser, otherUser) => {
    setIsRegenerating(true);
    setIsLoading(true);
    
    try {
      // If the otherUser has an _id, it's a direct message conversation
      // Otherwise, it's a group conversation
      const endpoint = otherUser._id 
        ? `/messages/summary/${otherUser._id}`
        : `/groups/summary/${otherUser._id}`;
      
      const res = await axiosInstance.get(endpoint);
      setSummary(res.data.summary || "No conversation summary available.");
    } catch (error) {
      console.error("Error generating summary:", error);
      
      // Fallback to local generation if API fails
      const generatedSummary = generateLocalSummary(messages, authUser, otherUser);
      setSummary(generatedSummary);
    } finally {
      setIsRegenerating(false);
      setIsLoading(false);
    }
  };
  
  // Generate a local summary when API is not available
  const generateLocalSummary = (messages, authUser, otherUser) => {
    // Extract conversation patterns
    const hasGreetings = messages.some(msg => 
      msg.text?.toLowerCase().includes("hi") || 
      msg.text?.toLowerCase().includes("hello") || 
      msg.text?.toLowerCase().includes("hey")
    );
    
    const hasWellbeingQuestions = messages.some(msg => 
      msg.text?.toLowerCase().includes("how are you") || 
      msg.text?.toLowerCase().includes("how's it going") || 
      msg.text?.toLowerCase().includes("what's up")
    );
    
    const hasPositiveResponses = messages.some(msg => 
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
        messages.some(msg => msg.text?.toLowerCase().includes(keyword))
      );
      
      if (topicMentioned) {
        detectedTopics.push(topic);
      }
    });
    
    // Build the summary
    let summaryText = "";
    const yourName = "You";
    const theirName = otherUser?.fullName || otherUser?.name || "Them";
    
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
    const yourMessageCount = messages.filter(msg => 
      msg.senderId === authUser._id || msg.senderId?._id === authUser._id
    ).length;
    
    const theirMessageCount = messages.length - yourMessageCount;
    
    summaryText += `In this conversation, ${yourName} sent ${yourMessageCount} messages and ${theirName} sent ${theirMessageCount} messages.`;
    
    // If we couldn't generate a meaningful summary, use a generic one
    if (summaryText.trim() === "") {
      summaryText = `This is a conversation between ${yourName} and ${theirName} with ${messages.length} messages in total.`;
    }
    
    return summaryText;
  };
  
  const handleRegenerate = () => {
    generateSummary(messages, authUser, otherUser);
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-base-100 rounded-lg shadow-xl w-full max-w-md">
        <div className="p-4 border-b border-base-300 flex justify-between items-center">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <BarChart2 className="size-5" />
            Conversation Summary
          </h3>
          <button onClick={onClose} className="btn btn-ghost btn-circle btn-sm">
            <X className="size-5" />
          </button>
        </div>
        
        <div className="p-6">
          {isSummaryLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="size-8 animate-spin text-primary" />
            </div>
          ) : (
            <p className="text-base-content">{summary}</p>
          )}
        </div>
        
        

        <div className="p-4 border-t border-base-300 flex justify-between">
          <button 
            onClick={handleRegenerate}
            className="btn btn-ghost btn-sm gap-2"
            disabled={isRegenerating || isSummaryLoading}
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