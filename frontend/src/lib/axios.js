// frontend/src/lib/axios.js
import axios from "axios";
import { getToken } from "./tokenStorage";

/* 1st choice: env var from Netlify      */
/* 2nd choice: localhost during dev      */
/* 3rd choice: hard‑coded Render backend */
const baseURL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV
    ? "http://localhost:5002/api"
    : "https://real-time-chat-backend-hcs8.onrender.com/api");

export const axiosInstance = axios.create({
  baseURL,
  withCredentials: true,        // <‑‑ send cookies / JWT refresh tokens
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error),
);