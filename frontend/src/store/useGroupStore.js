// frontend/src/store/useGroupStore.js
import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useGroupStore = create((set, get) => ({
  groups: [],
  selectedGroup: null,
  groupMessages: [],
  isLoadingGroups: false,
  isLoadingMessages: false,
  isCreatingGroup: false,
  isCreatingPoll: false,
  typingInGroup: {}, // Map of user IDs typing in each group
  smartReplies: [],
  isLoadingSmartReplies: false,
  
  // Create a new group
  createGroup: async (groupData) => {
    set({ isCreatingGroup: true });
    try {
      const res = await axiosInstance.post("/groups/create", groupData);
      set(state => ({ 
        groups: [res.data, ...state.groups],
        selectedGroup: res.data,
        isCreatingGroup: false
      }));
      toast.success("Group created successfully");
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create group");
      set({ isCreatingGroup: false });
      return false;
    }
  },
  
  // Get user's groups
  getGroups: async () => {
    set({ isLoadingGroups: true });
    try {
      const res = await axiosInstance.get("/groups");
      set({ groups: res.data, isLoadingGroups: false });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch groups");
      set({ isLoadingGroups: false });
    }
  },
  
  // Get messages for a group with safe poll data handling
  getGroupMessages: async (groupId) => {
    set({ isLoadingMessages: true });
    try {
      const res = await axiosInstance.get(`/groups/messages/${groupId}`);
      
      // Process messages to ensure poll data is properly formatted
      const processedMessages = res.data.map(message => {
        if (message.poll) {
          return {
            ...message,
            poll: {
              ...message.poll,
              options: Array.isArray(message.poll.options) 
                ? message.poll.options.map(option => ({
                  ...option,
                  votes: Array.isArray(option.votes) ? option.votes : []
                }))
                : []
            }
          };
        }
        return message;
      });
      
      set({ 
        groupMessages: processedMessages, 
        isLoadingMessages: false 
      });
    } catch (error) {
      console.error("Error fetching group messages:", error);
      toast.error(error.response?.data?.message || "Failed to fetch messages");
      set({ isLoadingMessages: false });
    }
  },
  
  // Send message to group - updated to handle documents safely
  sendGroupMessage: async (messageData) => {
    const { selectedGroup, groupMessages } = get();
    
    // Clear smart replies when sending a message
    set({ smartReplies: [] });
    
    try {
      // Create a clean copy of messageData without File objects
      const safeMessageData = {
        text: messageData.text,
        image: messageData.image,
        document: messageData.document ? {
          data: messageData.document.data,
          name: messageData.document.name,
          type: messageData.document.type,
          size: messageData.document.size
        } : null,
        voiceMessage: messageData.voiceMessage ? {
          data: messageData.voiceMessage.data,
          duration: messageData.voiceMessage.duration
        } : null
      };
      
      const res = await axiosInstance.post(`/groups/messages/${selectedGroup._id}`, safeMessageData);
      
      set({ groupMessages: [...groupMessages, res.data] });
      return true;
    } catch (error) {
      console.error("Error sending group message:", error);
      toast.error(error.response?.data?.message || "Failed to send message");
      return false;
    }
  },
  
  // Add members to a group
  addGroupMembers: async (groupId, memberIds) => {
    try {
      const res = await axiosInstance.post("/groups/members", { groupId, memberIds });
      
      // Update group in state
      set(state => ({
        groups: state.groups.map(g => 
          g._id === groupId ? res.data : g
        ),
        selectedGroup: state.selectedGroup?._id === groupId ? res.data : state.selectedGroup
      }));
      
      toast.success("Members added successfully");
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add members");
      return false;
    }
  },
  
  // Remove member from group
  removeGroupMember: async (groupId, memberId) => {
    try {
      const res = await axiosInstance.delete(`/groups/${groupId}/members/${memberId}`);
      
      // If group was deleted, remove from state
      if (res.data.message === "Group deleted as no members remain") {
        set(state => ({
          groups: state.groups.filter(g => g._id !== groupId),
          selectedGroup: state.selectedGroup?._id === groupId ? null : state.selectedGroup
        }));
        toast.success("You left the group");
        return true;
      }
      
      // Otherwise update group in state
      set(state => ({
        groups: state.groups.map(g => 
          g._id === groupId ? res.data : g
        ),
        selectedGroup: state.selectedGroup?._id === groupId ? res.data : state.selectedGroup
      }));
      
      toast.success("Member removed successfully");
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to remove member");
      return false;
    }
  },
  
  // Create a poll in the group
  createPoll: async (pollData) => {
    set({ isCreatingPoll: true });
    try {
      const res = await axiosInstance.post("/polls/create", pollData);
      
      // Add the new message to the group messages
      set(state => ({
        groupMessages: [...state.groupMessages, res.data],
        isCreatingPoll: false
      }));
      
      return true;
    } catch (error) {
      console.error("Error creating poll:", error);
      toast.error(error.response?.data?.message || "Failed to create poll");
      set({ isCreatingPoll: false });
      return false;
    }
  },
  
  // Vote on a poll with safe handling
  votePoll: async (voteData) => {
    try {
      console.log("Voting with data:", voteData);
      
      // Immediately update the local state for responsive UI
      // First, find the current state of the poll
      const { groupMessages } = get();
      
      const groupMessage = groupMessages.find(msg => 
        msg.poll && msg.poll._id === voteData.pollId
      );
      
      if (!groupMessage || !groupMessage.poll) {
        console.error("Poll not found in state:", voteData.pollId);
        return false;
      }
      
      const pollData = groupMessage.poll;
      const userId = useAuthStore.getState().authUser._id;
      
      // Create an optimistic update of the poll with the new vote
      const updatedOptions = pollData.options && Array.isArray(pollData.options) 
        ? pollData.options.map(option => {
            // Make a deep copy of the option
            const newOption = { 
              ...option,
              votes: [...(Array.isArray(option.votes) ? option.votes : [])]
            };
            
            // If this is the selected option, add the user's vote
            if (option._id === voteData.optionId) {
              // Check if the user already voted for this option
              const alreadyVoted = newOption.votes.some(vote => {
                if (typeof vote === 'string') return vote === userId;
                return vote?._id === userId;
              });
              
              if (!alreadyVoted) {
                // Add the vote - use full user object if we have it
                const authUser = useAuthStore.getState().authUser;
                newOption.votes.push(authUser);
              }
            } else {
              // Remove the user's vote from other options
              newOption.votes = newOption.votes.filter(vote => {
                if (typeof vote === 'string') return vote !== userId;
                return vote?._id !== userId;
              });
            }
            
            return newOption;
          })
        : [];
      
      // Update local state immediately for responsive UI
      set(state => ({
        groupMessages: state.groupMessages.map(msg => {
          if (msg.poll && msg.poll._id === voteData.pollId) {
            return {
              ...msg,
              poll: {
                ...msg.poll,
                options: updatedOptions
              }
            };
          }
          return msg;
        })
      }));
      
      // Now make the API call
      const res = await axiosInstance.post("/polls/vote", voteData);
      
      // If the API call fails, we'll revert the optimistic update
      if (!res.data || res.status !== 200) {
        console.error("API error:", res);
        toast.error("Failed to record your vote");
        
        // Revert to original state
        set(state => ({
          groupMessages: state.groupMessages.map(msg => {
            if (msg.poll && msg.poll._id === voteData.pollId) {
              return groupMessage; // Revert to original message
            }
            return msg;
          })
        }));
        
        return false;
      }
      
      // Successful API call - update with server response for consistency
      // Just in case the server response is different from our optimistic update
      if (res.data && res.data.options) {
        set(state => ({
          groupMessages: state.groupMessages.map(msg => {
            if (msg.poll && msg.poll._id === voteData.pollId) {
              return {
                ...msg,
                poll: res.data
              };
            }
            return msg;
          })
        }));
      }
      
      return true;
    } catch (error) {
      console.error("Error voting on poll:", error);
      toast.error("Failed to vote: " + (error.response?.data?.message || error.message));
      return false;
    }
  },
  
  // End a poll (only creator can end)
  endPoll: async (pollId) => {
    try {
      console.log("Attempting to end poll:", pollId);
      
      const res = await axiosInstance.put(`/polls/end/${pollId}`);
      console.log("End poll response:", res.data);
      
      if (res.status !== 200) {
        console.error("Unexpected response status:", res.status);
        return false;
      }
      
      // Update the poll in the messages
      set(state => ({
        groupMessages: state.groupMessages.map(msg => {
          if (msg.poll && msg.poll._id === pollId) {
            return { 
              ...msg, 
              poll: {
                ...msg.poll,
                isActive: false
              } 
            };
          }
          return msg;
        })
      }));
      
      // Fetch fresh data
      if (get().selectedGroup) {
        get().getGroupMessages(get().selectedGroup._id);
      }
      
      return true;
    } catch (error) {
      console.error("Error ending poll:", error);
      
      // Enhanced error reporting
      const errorMessage = error.response?.data?.message || 
                          error.response?.statusText || 
                          error.message || 
                          "Unknown error";
                          
      const statusCode = error.response?.status;
      
      if (statusCode === 403) {
        toast.error("You don't have permission to end this poll");
      } else {
        toast.error(`Failed to end poll: ${errorMessage}`);
      }
      
      return false;
    }
  },
  
  // Set selected group
  setSelectedGroup: (group) => {
    set({ selectedGroup: group });
    if (group) {
      get().getGroupMessages(group._id);
    }
  },
  
  // Get smart replies for the group
  getSmartReplies: async (message) => {
    if (!message) return;
    
    set({ isLoadingSmartReplies: true });
    try {
      const res = await axiosInstance.post("/smart-replies/generate", { message });
      set({ smartReplies: res.data.replies, isLoadingSmartReplies: false });
    } catch (error) {
      console.error("Error fetching smart replies:", error);
      set({ smartReplies: [], isLoadingSmartReplies: false });
    }
  },
  
  // Clear smart replies
  clearSmartReplies: () => {
    set({ smartReplies: [] });
  },
  
  // Subscribe to group socket events
  subscribeToGroupMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;
    
    // Handle new group message
    socket.on("newGroupMessage", (data) => {
      const { selectedGroup, groupMessages } = get();
      const { message, group } = data;
      
      // Add message to current chat if selected
      if (selectedGroup && selectedGroup._id === group._id) {
        set({ groupMessages: [...groupMessages, message] });
        
        // Mark as read
        socket.emit("readGroupMessage", {
          messageId: message._id,
          groupId: group._id
        });
        
        // Generate smart replies when receiving a new message
        if (message.text) {
          get().getSmartReplies(message.text);
        }
      }
      
      // Toast notification for messages in other groups
      if (!selectedGroup || selectedGroup._id !== group._id) {
        // Create a styled toast without JSX
        toast.custom((t) => {
          const toastId = t.id;
          const element = document.createElement('div');
          element.className = 'cursor-pointer p-3 bg-primary text-primary-content rounded';
          element.innerHTML = `<b>${group.name}</b>: ${message.text || "Sent an attachment"}`;
          element.onclick = () => {
            get().setSelectedGroup(get().groups.find(g => g._id === group._id));
            toast.dismiss(toastId);
          };
          return element;
        }, { duration: 4000 });
      }
    });
    
    // Handle poll votes with safe handling
    socket.on("pollVote", (data) => {
      console.log("Received poll vote socket event:", data);
      const { selectedGroup } = get();
      
      if (selectedGroup && selectedGroup._id === data.groupId) {
        // Make sure poll and options exist and are properly structured
        if (!data.poll) {
          console.error("Invalid poll data in socket event");
          return;
        }
        
        // Ensure options is always an array
        const safeOptions = Array.isArray(data.poll.options) 
          ? data.poll.options 
          : [];
        
        // Create a safer poll object
        const safePoll = {
          ...data.poll,
          options: safeOptions.map(option => ({
            ...option,
            // Ensure votes is always an array
            votes: Array.isArray(option.votes) ? option.votes : []
          })),
          // Ensure creator is an object
          creator: data.poll.creator || { _id: "", fullName: "Unknown" }
        };
        
        // Update state safely
        set(state => ({
          groupMessages: state.groupMessages.map(msg => {
            if (msg._id === data.messageId && msg.poll) {
              return {
                ...msg,
                poll: safePoll
              };
            }
            return msg;
          })
        }));
      }
    });
    
    // Handle poll ended
    socket.on("pollEnded", (data) => {
      const { selectedGroup } = get();
      
      if (selectedGroup && selectedGroup._id === data.groupId) {
        set(state => ({
          groupMessages: state.groupMessages.map(msg => {
            if (msg._id === data.messageId && msg.poll) {
              return { 
                ...msg, 
                poll: {
                  ...msg.poll,
                  isActive: false
                } 
              };
            }
            return msg;
          })
        }));
      }
    });
    
    // Handle new group
    socket.on("newGroup", (group) => {
      set(state => ({
        groups: [group, ...state.groups]
      }));
      
      toast.success(`You were added to group: ${group.name}`);
    });
    
    // Handle group updates
    socket.on("groupUpdated", (updatedGroup) => {
      set(state => ({
        groups: state.groups.map(g => 
          g._id === updatedGroup._id ? updatedGroup : g
        ),
        selectedGroup: state.selectedGroup?._id === updatedGroup._id 
          ? updatedGroup 
          : state.selectedGroup
      }));
    });
    
    // Handle removed from group
    socket.on("removedFromGroup", (data) => {
      set(state => ({
        groups: state.groups.filter(g => g._id !== data.groupId),
        selectedGroup: state.selectedGroup?._id === data.groupId ? null : state.selectedGroup
      }));
      
      toast.info(data.message);
    });
    
    // Handle added to group
    socket.on("addedToGroup", (group) => {
      set(state => ({
        groups: [group, ...state.groups]
      }));
      
      toast.success(`You were added to group: ${group.name}`);
    });
    
    // Handle typing in group
    socket.on("typingInGroup", (data) => {
      set(state => ({
        typingInGroup: {
          ...state.typingInGroup,
          [data.groupId]: {
            ...state.typingInGroup[data.groupId],
            [data.userId]: data.isTyping
          }
        }
      }));
    });

    socket.on("groupMessageReaction", (data) => {
      const { messageId, groupId, reaction, removed } = data;
      const { selectedGroup, groupMessages } = get();
      
      // Only update if this is the currently selected group
      if (selectedGroup && selectedGroup._id === groupId) {
        set({
          groupMessages: groupMessages.map(msg => {
            if (msg._id === messageId) {
              // If reaction was removed
              if (removed) {
                return {
                  ...msg,
                  reactions: Array.isArray(msg.reactions) 
                    ? msg.reactions.filter(r => 
                        !(r.userId === reaction.userId && r.emoji === reaction.emoji)
                      )
                    : []
                };
              }
              
              // If new reaction was added
              const reactions = Array.isArray(msg.reactions) ? msg.reactions : [];
              return {
                ...msg,
                reactions: [...reactions, reaction]
              };
            }
            return msg;
          })
        });
      }
    });
  },
  
  // Unsubscribe from group events
  unsubscribeFromGroupMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;
    
    socket.off("newGroupMessage");
    socket.off("pollVote");
    socket.off("pollEnded");
    socket.off("newGroup");
    socket.off("groupUpdated");
    socket.off("removedFromGroup");
    socket.off("addedToGroup");
    socket.off("typingInGroup");
    socket.off("groupMessageReaction");
  },
  
  // Send typing status in group
  sendGroupTypingStatus: (isTyping) => {
    const { selectedGroup } = get();
    if (!selectedGroup) return;
    
    const socket = useAuthStore.getState().socket;
    if (!socket || !socket.connected) return;
    
    socket.emit("typingInGroup", {
      groupId: selectedGroup._id,
      isTyping
    });
  },
  
  // Get users typing in selected group
  getGroupTypingUsers: () => {
    const { selectedGroup, typingInGroup } = get();
    if (!selectedGroup) return [];
    
    const groupTyping = typingInGroup[selectedGroup._id] || {};
    return Object.entries(groupTyping)
      .filter(([_, isTyping]) => isTyping)
      .map(([userId]) => userId);
  },

  reactToGroupMessage: async (messageId, emoji) => {
    try {
      const res = await axiosInstance.post(`/groups/messages/react/${messageId}`, { emoji });
      
      // Update message in state
      set(state => ({
        groupMessages: state.groupMessages.map(msg => 
          msg._id === messageId ? res.data : msg
        )
      }));
      
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to react to message");
      return false;
    }
  },
}));