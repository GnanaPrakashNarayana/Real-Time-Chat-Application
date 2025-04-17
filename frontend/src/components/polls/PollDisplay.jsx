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
  
  // Calculate percentage for each option
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
    <div className="bg-base-200 rounded-lg p-4 space-y-3 w-full max-w-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="size-5 text-primary" />
          <span className="font-medium">Poll</span>
        </div>
        {!poll.isActive && (
          <div className="badge badge-outline gap-1">
            <AlertTriangle className="size-3" />
            Closed
          </div>
        )}
      </div>
      
      <h3 className="font-medium text-lg">{poll.question}</h3>
      
      <div className="space-y-2 mt-2">
        {poll.options.map((option) => {
          const percentage = getPercentage(option.votes);
          const isSelected = selectedOption === option._id;
          const hasVotes = option.votes.length > 0;
          
          return (
            <div key={option._id} className="space-y-1">
              <div 
                className={`
                  relative p-3 rounded-lg cursor-pointer transition-all poll-option
                  ${poll.isActive && !selectedOption ? "hover:bg-base-300" : ""}
                  ${isSelected ? "bg-primary/10 border border-primary/30" : "bg-base-300"}
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
                        size-5 rounded-full flex items-center justify-center border
                        ${isSelected 
                          ? "bg-primary text-primary-content border-primary" 
                          : "bg-base-100 border-base-content/30"}
                      `}
                    >
                      {isSelected && <Check className="size-3" />}
                    </div>
                    <span>{option.text}</span>
                  </div>
                  <span className="text-sm">
                    {percentage}%
                  </span>
                </div>
                
                {/* Progress bar */}
                <div className="mt-2 h-1.5 w-full bg-base-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-500 ease-out poll-progress"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                
                {/* Votes count with hover effect to see voters */}
                {hasVotes && (
                  <div className="mt-1">
                    <button
                      className="text-xs text-base-content/70 hover:text-base-content hover:underline flex items-center gap-1"
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
                      <div className="mt-1 pl-6 space-y-1 animate-fadeIn">
                        {option.votes.map(voter => (
                          <div key={voter._id} className="flex items-center gap-2">
                            <div className="avatar">
                              <div className="size-5 rounded-full">
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
      
      {/* Vote button or results */}
      <div className="flex flex-col gap-2 pt-2">
        <div className="text-sm text-center text-base-content/70">
          <span>{totalVotes} {totalVotes === 1 ? "vote" : "votes"} total</span>
          {poll.isActive ? (
            selectedOption ? (
              <span> • You voted</span>
            ) : (
              <span> • Select an option to vote</span>
            )
          ) : (
            <span> • Poll ended</span>
          )}
        </div>
        
        {poll.isActive && (
          <div className="flex justify-center gap-2">
            {!selectedOption ? (
              <button
                className="btn btn-primary btn-sm w-full max-w-xs"
                onClick={handleVote}
                disabled={!selectedOption || isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Vote"}
              </button>
            ) : (
              <button
                className="btn btn-outline btn-sm w-full max-w-xs"
                onClick={() => setSelectedOption(null)}
                disabled={isSubmitting}
              >
                Change Vote
              </button>
            )}
            
            {isCreator && (
              <button
                className="btn btn-outline btn-error btn-sm"
                onClick={handleEndPoll}
              >
                End Poll
              </button>
            )}
          </div>
        )}
      </div>
      
      {/* Poll creator information */}
      <div className="flex items-center justify-between text-xs text-base-content/60 pt-2">
        <div className="flex items-center gap-1">
          <span>Created by </span>
          <div className="avatar">
            <div className="size-4 rounded-full">
              <img src={poll.creator.profilePic || "/avatar.png"} alt={poll.creator.fullName} />
            </div>
          </div>
          <span>{poll.creator.fullName}</span>
        </div>
      </div>
    </div>
  );
};

export default PollDisplay;