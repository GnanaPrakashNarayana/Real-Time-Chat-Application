// frontend/src/components/polls/PollDisplay.jsx
import { useState, useEffect } from "react";
import { useAuthStore } from "../../store/useAuthStore";
import { useGroupStore } from "../../store/useGroupStore";
import { BarChart3, Check, AlertTriangle, Users } from "lucide-react";
import toast from "react-hot-toast";

const PollDisplay = ({ poll, messageId }) => {

    // Fallback if poll data is invalid
    if (!poll || !poll._id) {
        return (
        <div className="w-full bg-base-200/50 p-3 rounded-lg">
            <p className="text-sm opacity-70">Poll data unavailable</p>
        </div>
        );
    }

    // Ensure poll structure is valid
    const safePoll = {
        ...poll,
        options: Array.isArray(poll.options) ? poll.options : [],
        creator: poll.creator || { fullName: "Unknown" },
        isActive: poll.isActive !== false
    };
  const [selectedOption, setSelectedOption] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedOption, setExpandedOption] = useState(null);
  
  const { authUser } = useAuthStore();
  const { votePoll, endPoll } = useGroupStore();
  
  // Defensive check for poll data structure
  const safeOptions = Array.isArray(poll.options) ? poll.options : [];
  
  // Check if user has already voted
  useEffect(() => {
    if (poll && authUser && Array.isArray(poll.options)) {
      // Find if user has voted for any option
      for (const option of poll.options) {
        const votes = Array.isArray(option.votes) ? option.votes : [];
        const hasVoted = votes.some(voter => voter && voter._id === authUser._id);
        if (hasVoted) {
          setSelectedOption(option._id);
          break;
        }
      }
    }
  }, [poll, authUser]);
  
  const calculateTotalVotes = () => {
    if (!poll || !Array.isArray(poll.options)) return 0;
    
    // Count votes more carefully
    let count = 0;
    for (const option of poll.options) {
      // Make sure we're counting actual votes
      if (option.votes && Array.isArray(option.votes)) {
        count += option.votes.length;
      }
    }
    return count;
  };
  
  const totalVotes = calculateTotalVotes();
  
  const getPercentage = (votes) => {
    // Safely handle votes array
    const voteCount = votes && Array.isArray(votes) ? votes.length : 0;
    
    // Important: Get freshly calculated total votes
    const currentTotalVotes = calculateTotalVotes();
    
    // If there are no votes at all, return 0
    if (currentTotalVotes === 0) return 0;
    
    // Calculate percentage, ensure it's an integer
    return Math.round((voteCount / currentTotalVotes) * 100);
  };
  
  
  
// After handling the vote submission
const handleVote = async () => {
    if (!selectedOption) return;
    
    setIsSubmitting(true);
    try {
      await votePoll({
        pollId: poll._id,
        optionId: selectedOption
      });
      
      // Force recalculation of vote count
      const newTotalVotes = calculateTotalVotes();
      setTotalVotes(newTotalVotes);
      
    } catch (error) {
      console.error("Error voting on poll:", error);
      toast.error("Failed to submit your vote");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle ending the poll
  const handleEndPoll = async () => {
    if (!confirm("Are you sure you want to end this poll?")) return;
    
    try {
      await endPoll(poll._id);
      toast.success("Poll ended successfully");
    } catch (error) {
      console.error("Error ending poll:", error);
      toast.error("Failed to end poll");
    }
  };
  
  // Check if current user is the poll creator
  const isCreator = poll.creator && authUser && poll.creator._id === authUser._id;
  
  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-2">
        <BarChart3 className="size-4 text-primary opacity-70" />
        <span className="text-sm font-medium">Poll</span>
        {poll.isActive === false && (
          <div className="badge badge-sm badge-outline gap-1 ml-auto">
            <AlertTriangle className="size-3" />
            Closed
          </div>
        )}
      </div>
      
      <h3 className="font-medium text-base mb-3">{poll.question}</h3>
      
      <div className="space-y-2">
        {safeOptions.map((option) => {
          const safeVotes = Array.isArray(option.votes) ? option.votes : [];
          const percentage = getPercentage(safeVotes);
          const isSelected = selectedOption === option._id;
          const hasVotes = safeVotes.length > 0;
          
          return (
            <div key={option._id || Math.random()} className="space-y-1">
              <div 
                className={`
                  relative p-2 rounded transition-all poll-option
                  ${poll.isActive && !selectedOption ? "hover:bg-base-200/50" : ""}
                  ${isSelected ? "bg-primary/10" : "bg-base-200/50"}
                `}
                onClick={() => {
                  if (poll.isActive && !isSubmitting) {
                    setSelectedOption(option._id);
                  }
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className={`
                        size-4 rounded-full flex items-center justify-center border
                        ${isSelected 
                          ? "bg-primary text-primary-content border-primary" 
                          : "border-base-content/30"}
                      `}
                    >
                      {isSelected && <Check className="size-3" />}
                    </div>
                    <span className="text-sm">{option.text}</span>
                  </div>
                  <span className="text-xs font-medium">
                    {percentage}%
                  </span>
                </div>
                
                {/* Progress bar */}
                <div className="mt-1.5 h-1 w-full bg-base-100/50 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-500 ease-out poll-progress"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                
                {/* Votes count with hover effect to see voters */}
                {hasVotes && (
                  <div className="mt-1">
                    <button
                      className="text-xs opacity-70 hover:opacity-100 hover:underline flex items-center gap-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedOption(expandedOption === option._id ? null : option._id);
                      }}
                    >
                      <Users className="size-3" />
                      {safeVotes.length} {safeVotes.length === 1 ? "vote" : "votes"}
                    </button>
                    
                    {/* Voters list */}
                    {expandedOption === option._id && (
                      <div className="mt-1 pl-5 space-y-1 animate-fadeIn">
                        {safeVotes.map(voter => (
                          <div key={voter?._id || Math.random()} className="flex items-center gap-1.5">
                            <div className="avatar">
                              <div className="size-4 rounded-full">
                                <img src={voter?.profilePic || "/avatar.png"} alt={voter?.fullName || "Voter"} />
                              </div>
                            </div>
                            <span className="text-xs">{voter?.fullName || "Unknown User"}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Vote controls */}
      <div className="flex items-center justify-between mt-3">
        <div className="text-xs opacity-70">
          {totalVotes} {totalVotes === 1 ? "vote" : "votes"}
          {selectedOption ? " • You voted" : ""}
        </div>
        
        <div className="flex gap-2">
          {poll.isActive !== false && (
            <>
              {!selectedOption ? (
                <button
                  className="btn btn-xs btn-primary"
                  onClick={handleVote}
                  disabled={!selectedOption || isSubmitting}
                >
                  {isSubmitting ? "Submitting..." : "Vote"}
                </button>
              ) : (
                <button
                  className="btn btn-xs btn-outline"
                  onClick={() => setSelectedOption(null)}
                  disabled={isSubmitting}
                >
                  Change
                </button>
              )}
              
              {isCreator && (
                <button
                  className="btn btn-xs btn-outline btn-error"
                  onClick={handleEndPoll}
                >
                  End Poll
                </button>
              )}
            </>
          )}
        </div>
      </div>
      
      {/* Poll creator information */}
      {poll.creator && (
        <div className="flex items-center mt-2 text-xs opacity-60">
          <span>Created by </span>
          <div className="avatar mx-1">
            <div className="size-3 rounded-full">
              <img src={poll.creator?.profilePic || "/avatar.png"} alt={poll.creator?.fullName || "Creator"} />
            </div>
          </div>
          <span>{poll.creator?.fullName || "Unknown"}</span>
        </div>
      )}
    </div>
  );
};

export default PollDisplay;