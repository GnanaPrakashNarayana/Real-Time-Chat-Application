// backend/src/index.js
import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import * as fs from 'fs';

import { connectDB } from "./lib/db.js";
import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import groupRoutes from "./routes/group.route.js";
import scheduledMessageRoutes from "./routes/scheduledMessage.route.js";
import bookmarkRoutes from "./routes/bookmark.route.js";
import pollRoutes from "./routes/poll.route.js";
import helperRoutes from "./routes/helper.route.js";
import debugRoutes from "./routes/debug.route.js";
import smartReplyRoutes from "./routes/smartReply.route.js"; // Add this import
import { app, server } from "./lib/socket.js";
import initScheduler from "./lib/scheduler.js";

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const PORT = process.env.PORT;

// → CORS configuration
const whitelist = [
  'https://chatterpillar.netlify.app',
  'http://localhost:5173',
  process.env.FRONTEND_URL,
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow tools like Postman / server‑side requests where origin may be undefined
    if (!origin || whitelist.includes(origin)) {
      callback(null, true);
    } else {
      console.warn('🚫 Blocked CORS origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

// Register CORS with the shared options
app.use(cors(corsOptions));

// Ensure pre‑flight (OPTIONS) requests use the *same* CORS config
app.options('*', cors(corsOptions));

// Request logging middleware for debugging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url} from ${req.headers.origin || 'unknown origin'}`);
  next();
});

// Other middleware
app.use(express.json({ limit: '50mb' }));
app.use(cookieParser());

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/scheduled-messages", scheduledMessageRoutes);
app.use("/api/bookmarks", bookmarkRoutes);
app.use("/api/polls", pollRoutes);
app.use("/api/helper", helperRoutes);
app.use("/api/debug", debugRoutes);
app.use("/api/smart-replies", smartReplyRoutes); // Add debug routes

// CORS test endpoint
app.get('/api/cors-test', (req, res) => {
  res.json({
    message: 'CORS is working correctly',
    origin: req.headers.origin,
    timestamp: new Date().toISOString()
  });
});

// Rest of your code remains unchanged
console.log("Starting server...");
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("Current directory:", __dirname);

if (process.env.NODE_ENV === "production") {
  try {
    // Use the specific path where we copied the files in the build script
    const frontendPath = "/opt/render/project/src/frontend/dist";
    
    console.log("Serving frontend from:", frontendPath);
    console.log("Frontend path exists:", fs.existsSync(frontendPath));
    
    // Serve static files
    app.use(express.static(frontendPath));
    
    // Handle all routes for single page application
    app.get("*", (req, res) => {
      try {
        const indexPath = path.join(frontendPath, "index.html");
        console.log("Index path:", indexPath);
        console.log("Index file exists:", fs.existsSync(indexPath));
        
        if (fs.existsSync(indexPath)) {
          res.sendFile(indexPath);
        } else {
          // Create a fallback HTML page dynamically if index.html isn't found
          res.send(`
            <!DOCTYPE html>
            <html>
              <head>
                <title>Chatterpillar - API Server</title>
                <style>
                  body { font-family: sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
                  h1 { color: #333; }
                  .message { background: #f8f9fa; padding: 15px; border-radius: 5px; }
                </style>
              </head>
              <body>
                <h1>Chatterpillar API Server</h1>
                <div class="message">
                  <p>The API server is running, but the frontend files were not found at the expected location.</p>
                  <p>This is likely a deployment configuration issue. Please check the build logs.</p>
                </div>
              </body>
            </html>
          `);
        }
      } catch (error) {
        console.error("Error serving index.html:", error);
        res.status(500).send("Error serving frontend");
      }
    });
  } catch (error) {
    console.error("Error setting up static file serving:", error);
  }
}

// IMPORTANT - KEEP THE ORIGINAL SERVER.LISTEN CALL - DON'T ADD A SECOND ONE
server.listen(PORT, () => {
  console.log("server is running on PORT:" + PORT);
  connectDB().then(() => {
    // Initialize the scheduler after DB connection is established
    console.log("Initializing scheduler...");
    try {
      const scheduler = initScheduler();
      console.log("Scheduler initialized successfully");
    } catch (error) {
      console.error("Failed to initialize scheduler:", error);
    }
  }).catch(err => {
    console.error("Failed to connect to database:", err);
  });
});