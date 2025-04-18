import { Sparkles } from "lucide-react";

const SmartReplySuggestions = ({ suggestions = [], onSendReply, isLoading = false }) => {
  // If there are no suggestions and not loading, don't render anything
  if ((!suggestions || suggestions.length === 0) && !isLoading) {
    return null;
  }
  
  return (
    <div className="px-4 py-3 border-t border-base-300 animate-fadeIn">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="size-4 text-primary" />
        <span className="text-xs font-medium">Smart Replies</span>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {isLoading ? (
          // Loading state
          Array(3).fill(0).map((_, i) => (
            <div key={i} className="h-8 bg-base-200/70 rounded-full animate-pulse w-24"></div>
          ))
        ) : (
          // Suggestions
          suggestions.map((suggestion, index) => (
            <button
              key={index}
              className="px-3 py-1.5 text-sm bg-base-200 hover:bg-primary/10 hover:text-primary rounded-full transition-colors"
              onClick={() => onSendReply(suggestion)}
            >
              {suggestion}
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export default SmartReplySuggestions;