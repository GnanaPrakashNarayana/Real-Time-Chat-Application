// frontend/src/components/polls/PollDisplay.jsx
import { useState, useEffect } from "react";
import { useAuthStore } from "../../store/useAuthStore";
import { useGroupStore } from "../../store/useGroupStore";
import { BarChart3, Check, AlertTriangle, Users } from "lucide-react";
import toast from "react-hot-toast";

const PollDisplay = ({ poll, messageId }) => {
  // Guard for bad data
  if (!poll || !poll._id) {
    console.error("Invalid poll data received:", poll);
    return (
      <div className="w-full bg-base-200/50 p-3 rounded-lg">
        <p className="text-sm opacity-70">Poll data unavailable</p>
      </div>
    );
  }

  // Normalize incoming poll
  const safePoll = {
    ...poll,
    options: Array.isArray(poll.options) ? poll.options : [],
    creator: poll.creator || { fullName: "Unknown", _id: "" },
    isActive: poll.isActive !== false,
  };

  const { authUser } = useAuthStore();
  const { votePoll, endPoll } = useGroupStore();

  const [selectedOption, setSelectedOption] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedOption, setExpandedOption] = useState(null);
  const [totalVotes, setTotalVotes] = useState(0);

  console.log("Poll data:", safePoll);
  console.log("Auth user:", authUser?._id);
  console.log("Creator ID:", safePoll.creator?._id);
  console.log("Is creator:", authUser?._id === safePoll.creator?._id);

  // Calculate total votes on poll data changes
  useEffect(() => {
    if (!safePoll?.options) return;
    
    const total = safePoll.options.reduce(
      (sum, option) => sum + (Array.isArray(option.votes) ? option.votes.length : 0),
      0
    );
    
    console.log("Calculating total votes:", total, "from options:", safePoll.options);
    setTotalVotes(total);
  }, [safePoll]);

  // Check if current user has already voted
  useEffect(() => {
    if (!safePoll.options || !authUser) return;

    for (const option of safePoll.options) {
      if (!option.votes) continue;
      
      const hasVoted = option.votes.some(vote => {
        if (typeof vote === 'string') return vote === authUser._id;
        return vote?._id === authUser._id;
      });
      
      if (hasVoted) {
        console.log("User has voted for option:", option._id);
        setSelectedOption(option._id);
        return;
      }
    }
    
    // If we reach here, user hasn't voted
    setSelectedOption(null);
  }, [safePoll.options, authUser]);

  const getPercentage = (votes) => {
    if (!votes || !Array.isArray(votes)) return 0;
    const voteCount = votes.length;
    console.log(`Calculating percentage: ${voteCount} votes out of ${totalVotes} total = ${totalVotes === 0 ? 0 : Math.round((voteCount / totalVotes) * 100)}%`);
    return totalVotes === 0 ? 0 : Math.round((voteCount / totalVotes) * 100);
  };

  const handleVote = async () => {
    if (!selectedOption) return;
    setIsSubmitting(true);
    
    console.log("Submitting vote for option:", selectedOption, "in poll:", safePoll._id);
    
    try {
      const success = await votePoll({ 
        pollId: safePoll._id, 
        optionId: selectedOption 
      });
      
      if (!success) {
        toast.error("Failed to submit your vote");
        setSelectedOption(null);
      } else {
        toast.success("Vote submitted successfully!");
      }
    } catch (error) {
      console.error("Error voting on poll:", error);
      toast.error("Failed to submit your vote");
      setSelectedOption(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEndPoll = async () => {
    if (!confirm("Are you sure you want to end this poll?")) return;
    
    // Simple local check to avoid unnecessary API calls
    if (safePoll.creator?._id !== authUser?._id) {
      toast.error("Only the poll creator can end this poll");
      return;
    }
    
    try {
      await endPoll(safePoll._id);
      toast.success("Poll ended successfully");
    } catch (error) {
      console.error("Error ending poll:", error);
      toast.error("Failed to end poll: " + (error.response?.data?.message || error.message));
    }
  };

  // Check if user is poll creator by comparing IDs as strings
  const isCreator = String(safePoll.creator?._id) === String(authUser?._id);
  
  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <BarChart3 className="size-4 text-primary opacity-70" />
        <span className="text-sm font-medium">Poll</span>
        {safePoll.isActive === false && (
          <div className="badge badge-sm badge-outline gap-1 ml-auto">
            <AlertTriangle className="size-3" />
            Closed
          </div>
        )}
      </div>

      <h3 className="font-medium text-base mb-3">{safePoll.question}</h3>

      {/* Debug info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="text-xs mb-2 p-1 bg-gray-800 text-white rounded">
          Creator: {safePoll.creator?._id} | You: {authUser?._id} | IsCreator: {isCreator ? 'Yes' : 'No'}
        </div>
      )}

      {/* Options list */}
      <div className="space-y-2">
        {safePoll.options.map((option) => {
          if (!option || !option._id) {
            console.error("Invalid option data:", option);
            return null;
          }
          
          const safeVotes = Array.isArray(option.votes) ? option.votes : [];
          const percentage = getPercentage(safeVotes);
          const isSelected = selectedOption === option._id;
          const hasVotes = safeVotes.length > 0;

          return (
            <div key={option._id} className="space-y-1">
              <div
                className={`relative p-2 rounded transition-all poll-option ${
                  safePoll.isActive && !isSubmitting ? "hover:bg-base-200/50 cursor-pointer" : ""
                } ${isSelected ? "bg-primary/10" : "bg-base-200/50"}`}
                onClick={() => {
                  if (safePoll.isActive && !isSubmitting) {
                    console.log("Option clicked:", option._id);
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
                {hasVotes && (
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
                        {safeVotes.map((v) => (
                          <div
                            key={typeof v === 'string' ? v : v?._id || Math.random()}
                            className="flex items-center gap-1.5"
                          >
                            <div className="avatar">
                              <div className="size-4 rounded-full">
                                <img
                                  src={v?.profilePic || "/avatar.png"}
                                  alt={v?.fullName || "Voter"}
                                />
                              </div>
                            </div>
                            <span className="text-xs">
                              {v?.fullName || "User"}
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

        {safePoll.isActive && (
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
      {safePoll.creator && (
        <div className="flex items-center mt-2 text-xs opacity-60">
          <span>Created by </span>
          <div className="avatar mx-1">
            <div className="size-3 rounded-full">
              <img
                src={safePoll.creator?.profilePic || "/avatar.png"}
                alt={safePoll.creator?.fullName || "Creator"}
              />
            </div>
          </div>
          <span>{safePoll.creator?.fullName || "Unknown"}</span>
        </div>
      )}
    </div>
  );
};

export default PollDisplay;