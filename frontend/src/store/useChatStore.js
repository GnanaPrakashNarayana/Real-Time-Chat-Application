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
  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    try {
      const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData);
      set({ messages: [...messages, res.data] });
    } catch (error) {
      toast.error(error.response.data.message);
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
  
  // Method to mark messages as read
  markMessagesAsRead: async () => {
    const { selectedUser } = get();
    if (!selectedUser) return;
    
    try {
      await axiosInstance.put(`/messages/read/${selectedUser._id}`);
      
      // Also emit socket event for immediate feedback
      const socket = useAuthStore.getState().socket;
      socket.emit("messageRead", {
        senderId: selectedUser._id,
        receiverId: useAuthStore.getState().authUser._id
      });
      
      // Update local messages to show as read
      set(state => ({
        messages: state.messages.map(msg => 
          msg.senderId === selectedUser._id ? {...msg, read: true} : msg
        )
      }));
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
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
  },
  
  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket.off("newMessage");
    socket.off("userTyping");
    socket.off("messagesRead");
  },

  setSelectedUser: (selectedUser) => set({ selectedUser }),
}));
