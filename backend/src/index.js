import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

import { connectDB } from "./lib/db.js";
import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import { app, server } from "./lib/socket.js";

// Load environment variables first
dotenv.config();

const PORT = process.env.PORT || 5002;

// Fix __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Basic middleware setup
app.use(express.json({ limit: '50mb' }));
app.use(cookieParser());

// Simple CORS setup
app.use(cors({
  origin: ['https://chatterpillar.netlify.app', 'http://localhost:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Handle preflight requests
app.options('*', cors());

// Root endpoint for basic testing
app.get('/', (req, res) => {
  res.status(200).send('Chat Backend Server is running');
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'API is running',
    time: new Date().toISOString()
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

// Start server
server.listen(PORT, () => {
  console.log(`Server is running on PORT: ${PORT}`);
  
  // Connect to database
  connectDB().then(connected => {
    if (connected) {
      console.log('Database connection successful');
    } else {
      console.error('Failed to connect to database');
    }
  });
});