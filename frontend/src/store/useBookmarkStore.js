// frontend/src/store/useBookmarkStore.js
import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";

export const useBookmarkStore = create((set, get) => ({
  bookmarks: [],
  isLoadingBookmarks: false,
  isAddingBookmark: false,
  
  // Get all bookmarks
  getBookmarks: async () => {
    set({ isLoadingBookmarks: true });
    try {
      const res = await axiosInstance.get("/bookmarks");
      set({ bookmarks: res.data, isLoadingBookmarks: false });
    } catch (error) {
      console.error("Error fetching bookmarks:", error);
      toast.error("Failed to fetch bookmarks");
      set({ isLoadingBookmarks: false });
    }
  },
  
  // Add a bookmark
  addBookmark: async (bookmarkData) => {
    set({ isAddingBookmark: true });
    try {
      const res = await axiosInstance.post("/bookmarks", bookmarkData);
      set(state => ({ 
        bookmarks: [res.data, ...state.bookmarks],
        isAddingBookmark: false 
      }));
      toast.success("Bookmark added");
      return res.data;
    } catch (error) {
      console.error("Error adding bookmark:", error);
      toast.error("Failed to add bookmark");
      set({ isAddingBookmark: false });
      return null;
    }
  },
  
  // Remove a bookmark
  removeBookmark: async (bookmarkId) => {
    try {
      await axiosInstance.delete(`/bookmarks/${bookmarkId}`);
      set(state => ({
        bookmarks: state.bookmarks.filter(b => b._id !== bookmarkId)
      }));
      toast.success("Bookmark removed");
      return true;
    } catch (error) {
      console.error("Error removing bookmark:", error);
      toast.error("Failed to remove bookmark");
      return false;
    }
  },
  
  // Rename a bookmark
  renameBookmark: async (bookmarkId, name) => {
    try {
      const res = await axiosInstance.put(`/bookmarks/${bookmarkId}`, { name });
      set(state => ({
        bookmarks: state.bookmarks.map(b => 
          b._id === bookmarkId ? res.data : b
        )
      }));
      toast.success("Bookmark renamed");
      return true;
    } catch (error) {
      console.error("Error renaming bookmark:", error);
      toast.error("Failed to rename bookmark");
      return false;
    }
  },
  
  // Find bookmarks for a specific conversation
  getConversationBookmarks: (conversationId, conversationType) => {
    return get().bookmarks.filter(
      b => b.conversationId === conversationId && b.conversationType === conversationType
    );
  },
  
  // Check if a message is bookmarked
  isMessageBookmarked: (messageId) => {
    return get().bookmarks.some(b => b.messageId === messageId);
  },
  
  // Get bookmark by message ID
  getBookmarkByMessageId: (messageId) => {
    return get().bookmarks.find(b => b.messageId === messageId) || null;
  }
}));