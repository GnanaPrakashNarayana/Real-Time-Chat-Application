// frontend/src/components/polls/PollDisplay.jsx
import { useState, useEffect } from "react";
import { useAuthStore } from "../../store/useAuthStore";
import { useGroupStore } from "../../store/useGroupStore";
import { BarChart3, Check, AlertTriangle, Users } from "lucide-react";
import toast from "react-hot-toast";

const PollDisplay = ({ poll, messageId }) => {
  const [selectedOption, setSelectedOption] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showVoters, setShowVoters] = useState(false);
  const [expandedOption, setExpandedOption] = useState(null);
  
  const { authUser } = useAuthStore();
  const { votePoll, endPoll } = useGroupStore();
  
  // Check if user has already voted
  useEffect(() => {
    if (poll && authUser) {
      // Find if user has voted for any option
      for (const option of poll.options) {
        const hasVoted = option.votes.some(voter => voter._id === authUser._id);
        if (hasVoted) {
          setSelectedOption(option._id);
          break;
        }
      }
    }
  }, [poll, authUser]);
  
  // Get total votes
  const totalVotes = poll.options.reduce((sum, option) => sum + option.votes.length, 0);
  
  // Calculate percentage for each option - fixed to handle zero case properly
  const getPercentage = (votes) => {
    if (totalVotes === 0) return 0;
    return Math.round((votes.length / totalVotes) * 100);
  };
  
  // Handle vote submission
  const handleVote = async () => {
    if (!selectedOption) return;
    
    setIsSubmitting(true);
    try {
      await votePoll({
        pollId: poll._id,
        optionId: selectedOption
      });
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
  
  const isCreator = poll.creator._id === authUser._id;
  
  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-2">
        <BarChart3 className="size-4 text-primary opacity-70" />
        <span className="text-sm font-medium">Poll</span>
        {!poll.isActive && (
          <div className="badge badge-sm badge-outline gap-1 ml-auto">
            <AlertTriangle className="size-3" />
            Closed
          </div>
        )}
      </div>
      
      <h3 className="font-medium text-base mb-3">{poll.question}</h3>
      
      <div className="space-y-2">
        {poll.options.map((option) => {
          const percentage = getPercentage(option.votes);
          const isSelected = selectedOption === option._id;
          const hasVotes = option.votes.length > 0;
          
          return (
            <div key={option._id} className="space-y-1">
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
                      {option.votes.length} {option.votes.length === 1 ? "vote" : "votes"}
                    </button>
                    
                    {/* Voters list */}
                    {expandedOption === option._id && (
                      <div className="mt-1 pl-5 space-y-1 animate-fadeIn">
                        {option.votes.map(voter => (
                          <div key={voter._id} className="flex items-center gap-1.5">
                            <div className="avatar">
                              <div className="size-4 rounded-full">
                                <img src={voter.profilePic || "/avatar.png"} alt={voter.fullName} />
                              </div>
                            </div>
                            <span className="text-xs">{voter.fullName}</span>
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
          {poll.isActive && (
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
      <div className="flex items-center mt-2 text-xs opacity-60">
        <span>Created by </span>
        <div className="avatar mx-1">
          <div className="size-3 rounded-full">
            <img src={poll.creator.profilePic || "/avatar.png"} alt={poll.creator.fullName} />
          </div>
        </div>
        <span>{poll.creator.fullName}</span>
      </div>
    </div>
  );
};

export default PollDisplay;