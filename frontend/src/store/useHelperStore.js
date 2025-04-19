import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";

export const useHelperStore = create((set, get) => ({
  messages: [],
  isLoading: false,
  
  // Send message to helper
  sendMessage: async (message) => {
    if (!message.trim()) return;
    
    // Add user message to chat
    const userMessage = {
      id: Date.now(),
      content: message,
      role: "user",
      timestamp: new Date().toISOString(),
    };
    
    set(state => ({
      messages: [...state.messages, userMessage],
      isLoading: true,
    }));
    
    try {
      const res = await axiosInstance.post("/helper/chat", { message });
      
      // Add helper response to chat
      const helperMessage = {
        id: Date.now() + 1,
        content: res.data.response,
        role: "assistant",
        timestamp: new Date().toISOString(),
      };
      
      set(state => ({
        messages: [...state.messages, helperMessage],
        isLoading: false,
      }));
      
      return true;
    } catch (error) {
      console.error("Error sending message to Helper:", error);
      
      // Add error message to chat
      const errorMessage = {
        id: Date.now() + 1,
        content: "Sorry, I'm having trouble responding right now. Please try again later.",
        role: "assistant",
        timestamp: new Date().toISOString(),
        isError: true,
      };
      
      set(state => ({
        messages: [...state.messages, errorMessage],
        isLoading: false,
      }));
      
      toast.error(error.response?.data?.message || "Failed to get Helper response");
      return false;
    }
  },
  
  // Clear chat history
  clearChat: () => {
    set({ messages: [] });
  },
}));