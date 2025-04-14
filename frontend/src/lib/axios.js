// frontend/src/lib/axios.js
import axios from "axios";
import { getToken } from "./tokenStorage";

// Define the correct base URL
export const axiosInstance = axios.create({
  baseURL: "https://real-time-chat-backend-hc48.onrender.com/api",
  timeout: 30000, // Increased timeout for slow connections
  withCredentials: false // Important for token auth
});

// Add better request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    console.log(`Request to: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    
    // Add token to all requests
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    console.error("Request failed:", error.message);
    return Promise.reject(error);
  }
);

// Add response interceptor for better debugging
axiosInstance.interceptors.response.use(
  (response) => {
    console.log(`Response from ${response.config.url}: Status ${response.status}`);
    return response;
  },
  (error) => {
    console.error("API Error:", error.message);
    
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", error.response.data);
    } else if (error.request) {
      console.error("No response received:", error.request);
    }
    
    return Promise.reject(error);
  }
);