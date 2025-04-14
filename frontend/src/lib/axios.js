import axios from "axios";
import { getToken } from "./tokenStorage";

// Create axios instance
export const axiosInstance = axios.create({
  baseURL: import.meta.env.MODE === "development" 
    ? "http://localhost:5002/api" 
    : "https://real-time-chat-backend-hcs8.onrender.com/api",
});

// Add request interceptor to include auth token in all requests
axiosInstance.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);