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
  
  // Get messages for a group
  getGroupMessages: async (groupId) => {
    set({ isLoadingMessages: true });
    try {
      const res = await axiosInstance.get(`/groups/messages/${groupId}`);
      set({ groupMessages: res.data, isLoadingMessages: false });
    } catch (error) {
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
  votePoll: async (voteData) => {
    try {
      const res = await axiosInstance.post("/polls/vote", voteData);
      
      // Update the poll in the messages
      set(state => ({
        groupMessages: state.groupMessages.map(msg => 
          msg.poll?._id === res.data._id 
            ? { ...msg, poll: res.data } 
            : msg
        )
      }));
      
      return true;
    } catch (error) {
      console.error("Error voting on poll:", error);
      toast.error(error.response?.data?.message || "Failed to submit vote");
      return false;
    }
  },
  
  // End a poll (only creator can end)
  endPoll: async (pollId) => {
    try {
      const res = await axiosInstance.put(`/polls/end/${pollId}`);
      
      // Update the poll in the messages
      set(state => ({
        groupMessages: state.groupMessages.map(msg => 
          msg.poll?._id === res.data._id 
            ? { ...msg, poll: res.data } 
            : msg
        )
      }));
      
      return true;
    } catch (error) {
      console.error("Error ending poll:", error);
      toast.error(error.response?.data?.message || "Failed to end poll");
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
    socket.on("pollVote", (data) => {
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