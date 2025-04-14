import { Server } from "socket.io";
import http from "http";
import express from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

// Load environment variables to ensure they're accessible
dotenv.config();

const app = express();
const server = http.createServer(app);

// Used to store online users
const userSocketMap = {}; // {userId: socketId}

// Create Socket.io server with matching CORS configuration
const io = new Server(server, {
  cors: {
    origin: [
      'https://chatterpillar.netlify.app',
      'http://localhost:5173',
      process.env.FRONTEND_URL
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  },
  // Add additional Socket.io options for reliability
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Helper function to get a user's socket ID
export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

// Verify token middleware for socket connections
const verifySocketToken = (socket, next) => {
  const token = socket.handshake.query.token;
  
  if (!token) {
    console.log("Socket connection rejected: No token provided");
    return next(new Error("Authentication error"));
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.userId;
    next();
  } catch (error) {
    console.log("Socket connection rejected: Invalid token", error.message);
    return next(new Error("Authentication error"));
  }
};

// Apply the token verification middleware
io.use(verifySocketToken);

// Handle socket connections
io.on("connection", (socket) => {
  console.log("A user connected", socket.id);

  const userId = socket.userId;
  if (userId) {
    userSocketMap[userId] = socket.id;
    console.log(`User ${userId} is now online with socket ${socket.id}`);
  }

  // Emit online users to all connected clients
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  // Handle disconnections
  socket.on("disconnect", () => {
    console.log("A user disconnected", socket.id);
    if (userId) {
      delete userSocketMap[userId];
      console.log(`User ${userId} is now offline`);
      io.emit("getOnlineUsers", Object.keys(userSocketMap));
    }
  });

  // Handle connection errors
  socket.on("error", (error) => {
    console.error(`Socket ${socket.id} error:`, error);
  });
});

// Log initial Socket.io server status
console.log(`Socket.io server initialized with CORS for: ${[
  'https://chatterpillar.netlify.app',
  'http://localhost:5173',
  process.env.FRONTEND_URL
].filter(Boolean).join(', ')}`);

export { io, app, server };