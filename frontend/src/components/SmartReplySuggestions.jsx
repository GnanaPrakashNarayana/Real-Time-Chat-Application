// Updated frontend/src/components/SmartReplySuggestions.jsx
import { Sparkles } from "lucide-react";
import { memo, useCallback } from "react";

const SmartReplySuggestions = memo(({ suggestions = [], onSendReply, isLoading = false }) => {
  // If there are no suggestions and not loading, don't render anything
  if ((!suggestions || suggestions.length === 0) && !isLoading) {
    return null;
  }
  
  // Memoize click handler for performance
  const handleClick = useCallback((suggestion) => {
    if (onSendReply) {
      onSendReply(suggestion);
    }
  }, [onSendReply]);
  
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
          // Suggestions - limit to 5 for better mobile display
          suggestions.slice(0, 5).map((suggestion, index) => (
            <button
              key={index}
              className="px-3 py-1.5 text-sm bg-base-200 hover:bg-primary/10 hover:text-primary rounded-full transition-colors"
              onClick={() => handleClick(suggestion)}
            >
              {suggestion}
            </button>
          ))
        )}
      </div>
    </div>
  );
});

SmartReplySuggestions.displayName = 'SmartReplySuggestions';

export default SmartReplySuggestions;