// frontend/src/lib/axios.js
import axios from "axios";
import { getToken } from "./tokenStorage";

export const axiosInstance = axios.create({
  baseURL: "https://real-time-chat-backend-hc48.onrender.com/api",
  timeout: 30000,
  withCredentials: false
});

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