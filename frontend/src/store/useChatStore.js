// frontend/src/store/useChatStore.js
import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";
import { createSafeDocumentObject } from "../lib/documentUtils"; 

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  isTyping: false,
  typingUsers: {}, // Store typing status keyed by user ID
  smartReplies: [],
  isLoadingSmartReplies: false,

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
      toast.error(error.response?.data?.message || "Failed to fetch users");
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
      toast.error(error.response?.data?.message || "Failed to fetch messages");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

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
    
    // Handle voice message preview
    let tempVoiceMessage = null;
    if (messageData.voiceMessage) {
      tempVoiceMessage = {
        duration: messageData.voiceMessage.duration || 0
      };
    }
    
    // Create temporary message object with correct property references
    const tempMessage = {
      _id: tempId,
      senderId: useAuthStore.getState().authUser._id,
      receiverId: selectedUser._id,
      text: messageData.text, 
      image: messageData.image,
      document: tempDocument,
      voiceMessage: tempVoiceMessage,
      createdAt: new Date().toISOString(),
      sending: true
    };
    
    set({ messages: [...messages, tempMessage] });
    
    // Clear smart replies when sending a message
    set({ smartReplies: [] });
    
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
        } : null,
        voiceMessage: messageData.voiceMessage ? {
          data: messageData.voiceMessage.data,
          duration: messageData.voiceMessage.duration
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
    if (!socket) return;

    socket.on("newMessage", (newMessage) => {
      const isMessageFromSelectedUser = newMessage.senderId === selectedUser._id;
      if (isMessageFromSelectedUser) {
        set({
          messages: [...get().messages, newMessage],
        });
        
        // Generate smart replies when receiving a new message
        if (newMessage.text) {
          get().getSmartReplies(newMessage.text);
        }
        
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
                reactions: msg.reactions?.filter(r => 
                  !(r.userId === reaction.userId && r.emoji === reaction.emoji)
                ) || []
              };
            }
            
            // If new reaction was added
            const reactions = msg.reactions || [];
            return {
              ...msg,
              reactions: [...reactions, reaction]
            };
          }
          return msg;
        })
      }));
    });
  },
  
  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;
    
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
  
  // Smart Reply functions
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

  clearSmartReplies: () => {
    set({ smartReplies: [] });
  },
}));