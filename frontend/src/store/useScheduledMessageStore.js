// frontend/src/store/useScheduledMessageStore.js
import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";

export const useScheduledMessageStore = create((set, get) => ({
  scheduledMessages: [],
  isLoading: false,
  isCreating: false,
  isDeleting: false,
  isUpdating: false,
  
  // Get all scheduled messages
  getScheduledMessages: async () => {
    set({ isLoading: true });
    try {
      const res = await axiosInstance.get("/scheduled-messages");
      set({ scheduledMessages: res.data, isLoading: false });
    } catch (error) {
      console.error("Error fetching scheduled messages:", error);
      toast.error(error.response?.data?.message || "Failed to load scheduled messages");
      set({ isLoading: false });
    }
  },
  
  // Create a new scheduled message
  createScheduledMessage: async (messageData) => {
    set({ isCreating: true });
    try {
      const res = await axiosInstance.post("/scheduled-messages", messageData);
      set(state => ({ 
        scheduledMessages: [...state.scheduledMessages, res.data],
        isCreating: false 
      }));
      toast.success("Message scheduled successfully");
      return true;
    } catch (error) {
      console.error("Error scheduling message:", error);
      toast.error(error.response?.data?.message || "Failed to schedule message");
      set({ isCreating: false });
      return false;
    }
  },
  
  // Delete a scheduled message
  deleteScheduledMessage: async (messageId) => {
    set({ isDeleting: true });
    try {
      await axiosInstance.delete(`/scheduled-messages/${messageId}`);
      set(state => ({
        scheduledMessages: state.scheduledMessages.filter(msg => msg._id !== messageId),
        isDeleting: false
      }));
      toast.success("Scheduled message deleted");
      return true;
    } catch (error) {
      console.error("Error deleting scheduled message:", error);
      toast.error(error.response?.data?.message || "Failed to delete scheduled message");
      set({ isDeleting: false });
      return false;
    }
  },
  
  // Update a scheduled message
  updateScheduledMessage: async (messageId, updateData) => {
    set({ isUpdating: true });
    try {
      const res = await axiosInstance.put(`/scheduled-messages/${messageId}`, updateData);
      set(state => ({
        scheduledMessages: state.scheduledMessages.map(msg => 
          msg._id === messageId ? res.data : msg
        ),
        isUpdating: false
      }));
      toast.success("Scheduled message updated");
      return true;
    } catch (error) {
      console.error("Error updating scheduled message:", error);
      toast.error(error.response?.data?.message || "Failed to update scheduled message");
      set({ isUpdating: false });
      return false;
    }
  },
}));