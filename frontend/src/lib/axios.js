import axios from "axios";
import { getToken } from "./tokenStorage";

// Define the correct base URL
export const axiosInstance = axios.create({
  baseURL: "https://real-time-chat-backend-hc48.onrender.com/api",
  timeout: 15000, // Add timeout
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