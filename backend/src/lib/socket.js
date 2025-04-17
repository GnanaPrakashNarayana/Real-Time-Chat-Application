import { Server } from "socket.io";
import http from "http";
import express from "express";
import jwt from "jsonwebtoken";

const app = express();
const server = http.createServer(app);

// In socket.js
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "https://chatterpillar.netlify.app",
      "https://chatterpillar.netlify.app/",
      process.env.FRONTEND_URL
    ],
    credentials: true,
    methods: ["GET", "POST"]
  },
});

export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

// used to store online users
const userSocketMap = {}; // {userId: socketId}

// Verify token middleware for socket
const verifySocketToken = (socket, next) => {
  const token = socket.handshake.query.token;
  
  if (!token) {
    return next(new Error("Authentication error"));
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.userId;
    next();
  } catch (error) {
    return next(new Error("Authentication error"));
  }
};

io.use(verifySocketToken);
// backend/src/lib/socket.js
// Modify the io.on("connection") block
io.on("connection", (socket) => {
  console.log("A user connected", socket.id);

  const userId = socket.userId;
  if (userId) userSocketMap[userId] = socket.id;

  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  // Add typing indicator event handlers
  socket.on("typing", (data) => {
    console.log("Typing event received:", data); // Add this line
    const receiverSocketId = getReceiverSocketId(data.receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("userTyping", {
        senderId: userId,
        isTyping: data.isTyping
      });
    }
  });

  // Add message read event handler
  socket.on("messageRead", (data) => {
    const receiverSocketId = getReceiverSocketId(data.senderId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("messagesRead", data.receiverId);
    }
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected", socket.id);
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });

  socket.on("getOnlineUsers", (userIds) => {
    console.log("Online users received:", userIds); // Add this line
    set({ onlineUsers: userIds });
  });
});

export { io, app, server };