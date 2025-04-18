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
  
 // In useGroupStore.js, update the getGroupMessages function:

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
  
  // Vote on a poll
 // In useGroupStore.js

  // Vote on a poll
  // In useGroupStore.js
  // In useGroupStore.js
  // In useGroupStore.js - Improve the votePoll function to properly update state
  // Update this function in frontend/src/store/useGroupStore.js
  // Update this function in frontend/src/store/useGroupStore.js
votePoll: async (voteData) => {
  try {
    console.log("Submitting vote:", voteData);
    
    // Validate vote data before sending
    if (!voteData.pollId || !voteData.optionId) {
      console.error("Invalid vote data:", voteData);
      toast.error("Invalid vote data");
      return false;
    }
    
    const res = await axiosInstance.post("/polls/vote", voteData);
    console.log("Vote response:", res.data);
    
    // Verify we got a valid response before updating state
    if (!res.data || !res.data._id || !Array.isArray(res.data.options)) {
      console.error("Received invalid poll data:", res.data);
      toast.error("Received invalid response from server");
      return false;
    }
    
    // Create a properly normalized poll object
    const normalizedPoll = {
      ...res.data,
      options: res.data.options.map(option => ({
        ...option,
        // Ensure votes are always arrays
        votes: Array.isArray(option.votes) ? option.votes : [],
        // Handle potential ID inconsistencies
        _id: option._id || option.id
      })),
      // Ensure creator is a valid object
      creator: res.data.creator || { _id: "", fullName: "Unknown" }
    };
    
    // Find the message containing this poll and update it
    set(state => {
      const updatedMessages = state.groupMessages.map(msg => {
        if (msg.poll && msg.poll._id === voteData.pollId) {
          return {
            ...msg,
            poll: normalizedPoll
          };
        }
        return msg;
      });
      
      return { groupMessages: updatedMessages };
    });
    
    // Force a refetch to ensure UI consistency
    setTimeout(() => {
      if (get().selectedGroup) {
        get().getGroupMessages(get().selectedGroup._id);
      }
    }, 500);
    
    return true;
  } catch (error) {
    console.error("Error voting on poll:", error);
    const errorMessage = error.response?.data?.message || error.message || "Unknown error";
    toast.error(`Failed to vote: ${errorMessage}`);
    return false;
  }
},
  
  // End a poll (only creator can end)
    // Update this function in frontend/src/store/useGroupStore.js
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
    
    // Handle poll votes
   // Inside subscribeToGroupMessages function
    // Update this socket handler in the subscribeToGroupMessages function in useGroupStore.js
    socket.on("pollVote", (data) => {
      console.log("Received poll vote socket event:", data);
      const { selectedGroup, groupMessages } = get();
      
      if (selectedGroup && selectedGroup._id === data.groupId) {
        // Ensure we always have valid poll data with options and votes arrays
        if (!data.poll || !Array.isArray(data.poll.options)) {
          console.error("Invalid poll data in socket event:", data.poll);
          return;
        }
        
        // Create a normalized poll object
        const normalizedPoll = {
          ...data.poll,
          options: data.poll.options.map(option => ({
            ...option,
            // Always ensure votes is an array
            votes: Array.isArray(option.votes) ? option.votes : [],
            _id: option._id || option.id // Handle potential inconsistency in ID field
          })),
          // Ensure creator is an object even if it's null
          creator: data.poll.creator || { fullName: "Unknown" }
        };
        
        console.log("Normalized socket poll data:", normalizedPoll);
        
        // Update messages with the new poll data
        set(state => ({
          groupMessages: state.groupMessages.map(msg => {
            if (msg._id === data.messageId && msg.poll) {
              // Replace the entire poll object
              return {
                ...msg,
                poll: normalizedPoll
              };
            }
            return msg;
          })
        }));
        
        // Try to force a UI refresh by slightly delaying another update
        setTimeout(() => {
          set(state => ({
            groupMessages: [...state.groupMessages]
          }));
        }, 100);
      }
    });
    // Handle poll ended
    socket.on("pollEnded", (data) => {
      const { selectedGroup, groupMessages } = get();
      
      if (selectedGroup && selectedGroup._id === data.groupId) {
        set(state => ({
          groupMessages: state.groupMessages.map(msg => 
            msg._id === data.messageId
              ? { ...msg, poll: data.poll }
              : msg
          )
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
                  reactions: msg.reactions.filter(r => 
                    !(r.userId === reaction.userId && r.emoji === reaction.emoji)
                  )
                };
              }
              
              // If new reaction was added
              return {
                ...msg,
                reactions: [...msg.reactions, reaction]
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