// In backend/src/index.js
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
import { app, server } from "./lib/socket.js";
import groupRoutes from "./routes/group.route.js";


const allowedOrigins = [
  "http://localhost:5173",
  "https://chatterpillar.netlify.app",
  "https://chatterpillar.netlify.app/"  // With trailing slash just in case
];

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const PORT = process.env.PORT;

app.use(express.static(path.join(__dirname, '../public')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.use(express.json({ limit: '50mb' }));
app.use(cookieParser());
// Update this section in backend/src/index.js
app.use(
  cors({
    origin: function(origin, callback) {
      // Allow requests with no origin (like mobile apps, curl, etc.)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.indexOf(origin) !== -1 || process.env.FRONTEND_URL === origin) {
        callback(null, true);
      } else {
        console.log("Blocked origin:", origin);
        callback(null, true); // Temporarily allow all origins while debugging
      }
    },
    credentials: true,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

// Add this after your CORS middleware
app.options('*', cors()); // Handle preflight requests

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/groups", groupRoutes);

console.log("Starting server...");
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("Current directory:", __dirname);

// In backend/src/index.js
// Find the production block and replace it

// Add this to your index.js to test CORS
app.get('/api/cors-test', (req, res) => {
  res.json({ 
    message: 'CORS is working!',
    origin: req.headers.origin,
    time: new Date().toISOString()
  });
});

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

server.listen(PORT, () => {
  console.log("server is running on PORT:" + PORT);
  connectDB();
});