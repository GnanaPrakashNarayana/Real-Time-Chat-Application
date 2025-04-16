import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  isTyping: false,
  typingUsers: {}, // Store typing status keyed by user ID

  isMarkingRead: false,
  sendRetries: {},

  markMessagesAsRead: async () => {
    const { selectedUser } = get();
    if (!selectedUser) return;
    
    // Use a debounce mechanism
    if (get().isMarkingRead) return;
    
    try {
      set({ isMarkingRead: true });
      
      // Update local state first for responsive UI
      set(state => ({
        messages: state.messages.map(msg => 
          msg.senderId === selectedUser._id ? {...msg, read: true} : msg
        )
      }));
      
      // Add timeout to reduce frequency of API calls
      setTimeout(async () => {
        try {
          await axiosInstance.put(`/messages/read/${selectedUser._id}`);
          
          // Emit socket event only if API call succeeds
          const socket = useAuthStore.getState().socket;
          if (socket?.connected) {
            socket.emit("messageRead", {
              senderId: selectedUser._id,
              receiverId: useAuthStore.getState().authUser._id
            });
          }
        } catch (error) {
          console.log("Error marking messages as read:", error);
          // Don't show this error to the user - it's not critical
        } finally {
          set({ isMarkingRead: false });
        }
      }, 1000);
      
    } catch (error) {
      console.error("Error preparing to mark messages as read:", error);
      set({ isMarkingRead: false });
    }
  },

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      set({ users: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isMessagesLoading: false });
    }
  },
  // Update the sendMessage function
// Add this to useChatStore.js
// frontend/src/store/useChatStore.js
sendMessage: async (messageData) => {
  const { selectedUser, messages } = get();
  // Create a temporary message object with a temporary ID to show immediately
  const tempId = Date.now().toString();
  const tempMessage = {
    _id: tempId,
    senderId: useAuthStore.getState().authUser._id,
    receiverId: selectedUser._id,
    text: messageData.text,
    image: messageData.image,
    document: messageData.document ? {
      name: messageData.document.name,
      type: messageData.document.type,
      size: messageData.document.size,
      // Temporary URL for preview
      url: URL.createObjectURL(messageData.document.file)
    } : null,
    createdAt: new Date().toISOString(),
    sending: true
  };
  
  // Add temp message to state immediately
  set({ messages: [...messages, tempMessage] });
  
  // Retry mechanism
  let retries = 3;
  let success = false;
  
  while (retries > 0 && !success) {
    try {
      const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData);
      
      // Replace temp message with actual message
      set(state => ({
        messages: state.messages.map(msg => 
          msg._id === tempId ? res.data : msg
        )
      }));
      
      success = true;
      return true;
    } catch (error) {
      retries--;
      console.log(`Error sending message. Retries left: ${retries}`, error);
      
      if (retries === 0) {
        // If all retries failed, mark the message as failed
        set(state => ({
          messages: state.messages.map(msg => 
            msg._id === tempId ? {...msg, sending: false, failed: true} : msg
          )
        }));
        toast.error("Failed to send message. Please try again.");
        return false;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return success;
},

  subscribeToMessages: () => {
    const { selectedUser } = get();
    if (!selectedUser) return;

    const socket = useAuthStore.getState().socket;

    socket.on("newMessage", (newMessage) => {
      const isMessageSentFromSelectedUser = newMessage.senderId === selectedUser._id;
      if (!isMessageSentFromSelectedUser) return;

      set({
        messages: [...get().messages, newMessage],
      });
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket.off("newMessage");
  },

  // Method to send typing status
  sendTypingStatus: (isTyping) => {
    const { selectedUser } = get();
    if (!selectedUser) return;
    
    const socket = useAuthStore.getState().socket;
    socket.emit("typing", {
      receiverId: selectedUser._id,
      isTyping
    });
  },
  
  
  // Enhanced subscribe method
  subscribeToMessages: () => {
    const { selectedUser } = get();
    if (!selectedUser) return;

    const socket = useAuthStore.getState().socket;

    socket.on("newMessage", (newMessage) => {
      const isMessageFromSelectedUser = newMessage.senderId === selectedUser._id;
      if (isMessageFromSelectedUser) {
        set({
          messages: [...get().messages, newMessage],
        });
        
        // Mark message as read if chat is open
        get().markMessagesAsRead();
      }
    });
    
    // Listen for typing indicators
    socket.on("userTyping", (data) => {
      if (data.senderId === selectedUser._id) {
        set(state => ({
          typingUsers: {
            ...state.typingUsers,
            [data.senderId]: data.isTyping
          }
        }));
      }
    });
    
    // Listen for read receipts
    socket.on("messagesRead", (readerId) => {
      if (readerId === selectedUser._id) {
        set(state => ({
          messages: state.messages.map(msg => 
            msg.senderId === useAuthStore.getState().authUser._id ? {...msg, read: true} : msg
          )
        }));
      }
    });
    
    // Listen for message reactions
    socket.on("messageReaction", (data) => {
      const { messageId, reaction, removed } = data;
      
      set(state => ({
        messages: state.messages.map(msg => {
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
      }));
    });
  },
  
  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket.off("newMessage");
    socket.off("userTyping");
    socket.off("messagesRead");
    socket.off("messageReaction");
  },

  reactToMessage: async (messageId, emoji) => {
    try {
      const res = await axiosInstance.post(`/messages/react/${messageId}`, { emoji });
      
      // Update message in state
      set(state => ({
        messages: state.messages.map(msg => 
          msg._id === messageId ? res.data : msg
        )
      }));
      
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to react to message");
      return false;
    }
  },

  setSelectedUser: (selectedUser) => set({ selectedUser }),
}));
