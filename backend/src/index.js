import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";

import { connectDB } from "./lib/db.js";
import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import { app, server } from "./lib/socket.js";
import { corsMiddleware } from "./middleware/cors.middleware.js";

// Load environment variables first
dotenv.config();

const PORT = process.env.PORT || 5002;
const __dirname = path.resolve();

// Apply custom CORS middleware first (before any other middleware)
app.use(corsMiddleware);

// Middleware setup
app.use(express.json({ limit: '50mb' })); // Increased limit for image uploads
app.use(cookieParser());

// Additional standard CORS middleware as fallback
app.use(
  cors({
    origin: [
      'https://chatterpillar.netlify.app',
      'http://localhost:5173',
      process.env.FRONTEND_URL
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

// Handle preflight requests explicitly
app.options('*', cors());

// Health check endpoint to verify the API is running
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
  console.log(`Frontend URL: ${process.env.FRONTEND_URL || 'Not configured'}`);
  
  // Connect to database
  connectDB().then(connected => {
    if (connected) {
      console.log('Database connection successful');
    } else {
      console.error('Failed to connect to database');
    }
  });
});

// Handle server shutdown gracefully
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});