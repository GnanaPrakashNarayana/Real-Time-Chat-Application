// backend/src/index.js - Simplified CORS setup

// Load dependencies
import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";
import { corsMiddleware } from "./middleware/cors.middleware.js";
import { connectDB } from "./lib/db.js";
import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import { app, server } from "./lib/socket.js";

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 5002;
const __dirname = path.resolve();

// Apply CORS middleware first (important!)
app.use(corsMiddleware);

// Basic middleware
app.use(express.json({ limit: '50mb' }));
app.use(cookieParser());

// Only use one CORS implementation to avoid conflicts
// DO NOT add a second cors() middleware here

// Simple test endpoint
app.get('/', (req, res) => {
  res.status(200).send('Chat Backend Server is running');
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'API is running',
    time: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(500).json({ 
    message: "Internal server error", 
    error: process.env.NODE_ENV === 'production' ? null : err.message 
  });
});

// Serve frontend in production
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));

  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"));
  });
}

// Start server
server.listen(PORT, () => {
  console.log(`Server is running on PORT: ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Connect to database
  connectDB().then(connected => {
    if (connected) {
      console.log('Database connection successful');
    } else {
      console.error('Failed to connect to database');
    }
  });
});