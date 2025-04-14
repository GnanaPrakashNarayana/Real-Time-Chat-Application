// frontend/src/lib/axios.js
import axios from "axios";
import { getToken } from "./tokenStorage";

// Define the correct base URL
export const axiosInstance = axios.create({
  baseURL: "https://real-time-chat-backend-hc48.onrender.com/api",
  timeout: 15000, // Add timeout
  withCredentials: false // Set to false when using token auth
});

// Add more detailed request logging
axiosInstance.interceptors.request.use(
  (config) => {
    console.log(`Request to: ${config.baseURL}${config.url}`);
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor for better error logging
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error.message);
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", error.response.data);
    }
    return Promise.reject(error);
  }
);