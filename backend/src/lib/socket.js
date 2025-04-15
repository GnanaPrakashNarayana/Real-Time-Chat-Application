import { Server } from "socket.io";
import http from "http";
import express from "express";
import jwt from "jsonwebtoken";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [process.env.FRONTEND_URL, "http://localhost:5173"],
    credentials: true,
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

io.on("connection", (socket) => {
  console.log("A user connected", socket.id);

  const userId = socket.userId;
  if (userId) userSocketMap[userId] = socket.id;

  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  socket.on("disconnect", () => {
    console.log("A user disconnected", socket.id);
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });

  // --- READ RECEIPTS FEATURE ---
  // Listen for a read receipt event from the client.
  // Data payload should include { messageId, readerId, senderId }
  socket.on("message-read", (data) => {
    console.log("Message read event received:", data);
    // Retrieve the sender's socket to notify them
    const senderSocketId = getReceiverSocketId(data.senderId);
    if (senderSocketId) {
      io.to(senderSocketId).emit("message-read-update", {
        messageId: data.messageId,
        readerId: data.readerId,
      });
    }
    // Optionally: Update the message status in the database
  });
  
  // --- TYPING INDICATOR FEATURE ---
  // Listen for typing events from the client.
  // Data payload should include { chatId, userId, isTyping }
  socket.on("typing", (data) => {
    console.log("Typing event:", data);
    // Broadcast to all other connected sockets
    socket.broadcast.emit("typing-indicator", {
      chatId: data.chatId,
      userId: data.userId,
      isTyping: data.isTyping,
    });
  });

});

export { io, app, server };