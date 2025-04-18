import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

import { createSafeSocket } from "../lib/safeSocket";

// Token storage functions
const setToken = (token) => {
  localStorage.setItem('authToken', token);
};

const getToken = () => {
  return localStorage.getItem('authToken');
};

const removeToken = () => {
  localStorage.removeItem('authToken');
};

const BASE_URL = import.meta.env.MODE === "development" ? "http://localhost:5002" : "https://real-time-chat-backend-hcs8.onrender.com";

export const useAuthStore = create((set, get) => ({
  authUser: null,
  isSigningUp: false,
  isLoggingIn: false,
  isUpdatingProfile: false,
  isCheckingAuth: true,
  onlineUsers: [],
  socket: null,

  checkAuth: async () => {
    try {
      const token = getToken();
      if (!token) {
        set({ authUser: null, isCheckingAuth: false });
        return;
      }
      
      const res = await axiosInstance.get("/auth/check");
      set({ authUser: res.data });
      get().connectSocket();
    } catch (error) {
      console.log("Error in checkAuth:", error);
      removeToken(); // Clear token if invalid
      set({ authUser: null });
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  signup: async (data) => {
    set({ isSigningUp: true });
    try {
      const res = await axiosInstance.post("/auth/signup", data);
      setToken(res.data.token); // Save token to localStorage
      const userData = { ...res.data };
      delete userData.token; // Remove token from user data object
      
      set({ authUser: userData });
      toast.success("Account created successfully");
      get().connectSocket();
    } catch (error) {
      toast.error(error.response?.data?.message || "Signup failed");
    } finally {
      set({ isSigningUp: false });
    }
  },

  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post("/auth/login", data);
      setToken(res.data.token); // Save token to localStorage
      const userData = { ...res.data };
      delete userData.token; // Remove token from user data object
      
      set({ authUser: userData });
      toast.success("Logged in successfully");

      get().connectSocket();
    } catch (error) {
      toast.error(error.response?.data?.message || "Login failed");
    } finally {
      set({ isLoggingIn: false });
    }
  },

  logout: async () => {
    try {
      await axiosInstance.post("/auth/logout");
      removeToken(); // Remove token from localStorage
      get().disconnectSocket();
      set({ authUser: null });
      toast.success("Logged out successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Logout failed");
      // Still remove token and user data on error
      removeToken();
      set({ authUser: null });
    }
  },

  updateProfile: async (data) => {
    set({ isUpdatingProfile: true });
    try {
      const res = await axiosInstance.put("/auth/update-profile", data);
      set({ authUser: res.data });
      toast.success("Profile updated successfully");
    } catch (error) {
      console.log("error in update profile:", error);
      toast.error(error.response?.data?.message || "Failed to update profile");
    } finally {
      set({ isUpdatingProfile: false });
    }
  },

  connectSocket: () => {
    const { authUser } = get();
    if (!authUser) return;
    
    // If already connected, don't reconnect
    const currentSocket = get().socket;
    if (currentSocket && currentSocket.connected) {
      console.log("Socket already connected");
      return;
    }
  
    // Disconnect any existing socket first
    if (currentSocket) {
      try {
        currentSocket.disconnect();
      } catch (err) {
        console.error("Error disconnecting socket:", err);
      }
    }
  
    const token = getToken();
    if (!token) return;
  
    console.log("Connecting to socket...");
    
    try {
      // Add reconnection options
      const rawSocket = io(BASE_URL, {
        query: {
          token: token
        },
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
      });
      
      // Create a safe wrapper around the raw socket
      const safeSocket = createSafeSocket(rawSocket);
      
      // Set socket before adding listeners to avoid race conditions
      set({ socket: safeSocket });
      
      // Use safe event handlers
      safeSocket.on("connect", () => {
        console.log("Socket connected:", safeSocket.id);
      });
      
      safeSocket.on("connect_error", (error) => {
        console.error("Socket connection error:", error);
      });
      
      safeSocket.on("getOnlineUsers", (userIds) => {
        console.log("Online users:", userIds);
        if (Array.isArray(userIds)) {
          set({ onlineUsers: userIds });
        } else {
          console.warn("Received non-array online users data:", userIds);
          set({ onlineUsers: [] });
        }
      });
      
      safeSocket.on("disconnect", (reason) => {
        console.log("Socket disconnected:", reason);
      });
      
    } catch (error) {
      console.error("Error setting up socket connection:", error);
    }
  },
  
  disconnectSocket: () => {
    const socket = get().socket;
    if (socket) {
      try {
        socket.disconnect();
      } catch (error) {
        console.error("Error disconnecting socket:", error);
      } finally {
        set({ socket: null });
      }
    }
  }
}));