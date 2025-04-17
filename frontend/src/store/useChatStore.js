import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";
import { createSafeDocumentObject } from "../lib/documentUtils"; // Import utility
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
// In frontend/src/store/useChatStore.js
// Find the sendMessage function and update the tempMessage creation:

// In frontend/src/store/useChatStore.js

// Update sendMessage function
// In frontend/src/store/useChatStore.js
// Update the sendMessage function to avoid file references:

// In frontend/src/store/useChatStore.js
// Update sendMessage function:

sendMessage: async (messageData) => {
  const { selectedUser, messages } = get();
  const tempId = Date.now().toString();
  
  // Create a temp document object without any File references
  let tempDocument = null;
  if (messageData.document) {
    tempDocument = {
      name: messageData.document.name || 'Document',
      type: messageData.document.type || 'application/octet-stream',
      size: messageData.document.size || 0,
    };
  }
  
  // In useChatStore.js
  // Make sure the text is being passed directly without additional comments
  const tempMessage = {
    _id: tempId,
    senderId: useAuthStore.getState().authUser._id,
    receiverId: selectedUser._id,
    text: messageText, // Should be just the message text, no debug info
    image: messageImage,
    document: tempDocument,
    createdAt: new Date().toISOString(),
    sending: true
  };
  set({ messages: [...messages, tempMessage] });
  
  try {
    // Create a clean copy without any references to file objects
    const apiMessageData = {
      text: messageData.text,
      image: messageData.image,
      document: messageData.document ? {
        data: messageData.document.data,
        name: messageData.document.name,
        type: messageData.document.type,
        size: messageData.document.size
      } : null
    };
    
    const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, apiMessageData);
    
    set(state => ({
      messages: state.messages.map(msg => 
        msg._id === tempId ? res.data : msg
      )
    }));
    
    return true;
  } catch (error) {
    console.error("Error sending message:", error);
    set(state => ({
      messages: state.messages.map(msg => 
        msg._id === tempId ? {...msg, sending: false, failed: true} : msg
      )
    }));
    return false;
  }
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
