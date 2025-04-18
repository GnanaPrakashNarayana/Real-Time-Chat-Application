// Frontend/src/components/polls/PollDisplay.jsx
import { useState, useEffect, useRef } from "react";
import { useAuthStore } from "../../store/useAuthStore";
import { useGroupStore } from "../../store/useGroupStore";
import { BarChart3, Check, AlertTriangle, Users } from "lucide-react";
import toast from "react-hot-toast";

const PollDisplay = ({ poll: initialPoll, messageId }) => {
  // Basic validation
  if (!initialPoll || !initialPoll._id) {
    return (
      <div className="w-full bg-base-200/50 p-3 rounded-lg">
        <p className="text-sm opacity-70">Poll data unavailable</p>
      </div>
    );
  }

  const { authUser } = useAuthStore();
  const { votePoll, endPoll } = useGroupStore();
  
  // Keep a local copy of the poll that we can update for immediate UI feedback
  const [localPoll, setLocalPoll] = useState(initialPoll);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedOption, setExpandedOption] = useState(null);
  const [totalVotes, setTotalVotes] = useState(0);
  
  // Update local poll when the prop changes
  useEffect(() => {
    setLocalPoll(initialPoll);
  }, [initialPoll]);
  
  // Calculate total votes
  useEffect(() => {
    if (!localPoll?.options) return;
    
    let total = 0;
    for (const option of localPoll.options) {
      if (Array.isArray(option.votes)) {
        total += option.votes.length;
      }
    }
    
    console.log(`Setting total votes to ${total}`);
    setTotalVotes(total);
  }, [localPoll]);

  // Find if user has already voted
  useEffect(() => {
    if (!localPoll?.options || !authUser?._id) return;

    let foundVote = false;
    for (const option of localPoll.options) {
      if (!Array.isArray(option.votes)) continue;
      
      const userVoted = option.votes.some(vote => {
        if (typeof vote === 'string') {
          return vote === authUser._id;
        }
        return vote?._id === authUser._id;
      });
      
      if (userVoted) {
        setSelectedOption(option._id);
        foundVote = true;
        break;
      }
    }
    
    if (!foundVote) {
      setSelectedOption(null);
    }
  }, [localPoll, authUser]);

  // Calculate percentage for an option
  const getPercentage = (option) => {
    if (!option || !Array.isArray(option.votes)) return 0;
    return totalVotes === 0 ? 0 : Math.round((option.votes.length / totalVotes) * 100);
  };

  // Process a vote locally without waiting for server
  const processLocalVote = (optionId) => {
    if (!localPoll?.options || !authUser || !optionId) return;
    
    // Create a deep copy of the poll to avoid mutations
    const updatedPoll = {
      ...localPoll,
      options: localPoll.options.map(option => {
        // Make a deep copy of each option
        const newOption = {
          ...option,
          votes: [...(Array.isArray(option.votes) ? option.votes : [])]
        };
        
        // If this is the selected option, add user's vote
        if (option._id === optionId) {
          // Check if user already voted for this option
          const alreadyVoted = newOption.votes.some(vote => {
            if (typeof vote === 'string') return vote === authUser._id;
            return vote?._id === authUser._id;
          });
          
          if (!alreadyVoted) {
            // Add vote - use either the full user object or just the ID
            newOption.votes.push(authUser);
          }
        } else {
          // Remove user's vote from other options
          newOption.votes = newOption.votes.filter(vote => {
            if (typeof vote === 'string') return vote !== authUser._id;
            return vote?._id !== authUser._id;
          });
        }
        
        return newOption;
      })
    };
    
    // Update local state immediately
    setLocalPoll(updatedPoll);
  };

  // Handle vote submission
  const handleVote = async () => {
    if (!selectedOption) return;
    setIsSubmitting(true);
    
    // Apply vote locally first for immediate feedback
    processLocalVote(selectedOption);
    
    try {
      // Then send to server
      const success = await votePoll({ 
        pollId: localPoll._id, 
        optionId: selectedOption 
      });
      
      if (!success) {
        toast.error("Server couldn't record your vote, but it's shown locally");
      }
    } catch (error) {
      console.error("Error voting:", error);
      toast.error("Vote recorded locally only. Server error: " + (error.message || "Unknown error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle ending poll
  const handleEndPoll = async () => {
    if (!confirm("Are you sure you want to end this poll?")) return;
    
    try {
      await endPoll(localPoll._id);
    } catch (error) {
      console.error("Error ending poll:", error);
      
      // Show specific error for permission issues
      if (error.response?.status === 403) {
        toast.error("Only the poll creator can end this poll");
      } else {
        toast.error("Failed to end poll: " + (error.message || "Unknown error"));
      }
    }
  };

  // Check if current user is poll creator
  const isCreator = String(localPoll.creator?._id) === String(authUser?._id);
  
  // Debug information
  console.log("Poll display:", {
    pollId: localPoll._id,
    totalVotes,
    optionCount: localPoll.options.length,
    voteCounts: localPoll.options.map(o => o.votes?.length || 0),
    selectedOption,
    isCreator
  });

  return (
    <div className="w-full">
      {/* Poll Header */}
      <div className="flex items-center gap-2 mb-2">
        <BarChart3 className="size-4 text-primary opacity-70" />
        <span className="text-sm font-medium">Poll</span>
        {localPoll.isActive === false && (
          <div className="badge badge-sm badge-outline gap-1 ml-auto">
            <AlertTriangle className="size-3" />
            Closed
          </div>
        )}
      </div>

      <h3 className="font-medium text-base mb-3">{localPoll.question}</h3>

      {/* Debug info for development */}
      {process.env.NODE_ENV !== 'production' && (
        <div className="mb-2 p-1 text-xs font-mono bg-base-300 rounded-md">
          Total votes: {totalVotes} | User voted: {selectedOption ? 'Yes' : 'No'}
        </div>
      )}

      {/* Options list */}
      <div className="space-y-2">
        {localPoll.options.map((option) => {
          const safeVotes = Array.isArray(option.votes) ? option.votes : [];
          const percentage = getPercentage(option);
          const isSelected = selectedOption === option._id;
          
          // Debug info for votes on this option
          console.log(`Option ${option.text}: ${safeVotes.length} votes (${percentage}%)`);

          return (
            <div key={option._id} className="space-y-1">
              <div
                className={`relative p-2 rounded transition-all poll-option ${
                  localPoll.isActive ? "hover:bg-base-200/50 cursor-pointer" : ""
                } ${isSelected ? "bg-primary/10" : "bg-base-200/50"}`}
                onClick={() => {
                  if (localPoll.isActive && !isSubmitting) {
                    setSelectedOption(option._id);
                  }
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={`size-4 rounded-full flex items-center justify-center border ${
                        isSelected
                          ? "bg-primary text-primary-content border-primary"
                          : "border-base-content/30"
                      }`}
                    >
                      {isSelected && <Check className="size-3" />}
                    </div>
                    <span className="text-sm">{option.text}</span>
                  </div>
                  <span className="text-xs font-medium">{percentage}%</span>
                </div>

                {/* Progress bar */}
                <div className="mt-1.5 h-1 w-full bg-base-100/50 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-500 ease-out poll-progress"
                    style={{ width: `${percentage}%` }}
                  />
                </div>

                {/* Votes list toggle */}
                {safeVotes.length > 0 && (
                  <div className="mt-1">
                    <button
                      className="text-xs opacity-70 hover:opacity-100 hover:underline flex items-center gap-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedOption(
                          expandedOption === option._id ? null : option._id
                        );
                      }}
                    >
                      <Users className="size-3" />
                      {safeVotes.length} {safeVotes.length === 1 ? "vote" : "votes"}
                    </button>

                    {expandedOption === option._id && (
                      <div className="mt-1 pl-5 space-y-1 animate-fadeIn">
                        {safeVotes.map((voter) => (
                          <div
                            key={typeof voter === 'string' ? voter : voter?._id || Math.random().toString()}
                            className="flex items-center gap-1.5"
                          >
                            <div className="avatar">
                              <div className="size-4 rounded-full">
                                <img
                                  src={voter?.profilePic || "/avatar.png"}
                                  alt={voter?.fullName || "Voter"}
                                />
                              </div>
                            </div>
                            <span className="text-xs">
                              {voter?.fullName || "User"}
                            </span>
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

      {/* Footer controls */}
      <div className="flex items-center justify-between mt-3">
        <div className="text-xs opacity-70">
          {totalVotes} {totalVotes === 1 ? "vote" : "votes"}
          {selectedOption ? " • You voted" : ""}
        </div>

        {localPoll.isActive && (
          <div className="flex gap-2">
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
          </div>
        )}
      </div>

      {/* Creator details */}
      {localPoll.creator && (
        <div className="flex items-center mt-2 text-xs opacity-60">
          <span>Created by </span>
          <div className="avatar mx-1">
            <div className="size-3 rounded-full">
              <img
                src={localPoll.creator?.profilePic || "/avatar.png"}
                alt={localPoll.creator?.fullName || "Creator"}
              />
            </div>
          </div>
          <span>{localPoll.creator?.fullName || "Unknown"}</span>
        </div>
      )}
    </div>
  );
};

export default PollDisplay;