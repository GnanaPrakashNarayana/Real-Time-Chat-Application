import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";

import path from "path";

import { connectDB } from "./lib/db.js";

import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import { app, server } from "./lib/socket.js";
import groupRoutes from "./routes/group.route.js";

import * as fs from 'fs';



dotenv.config();

const PORT = process.env.PORT;
const __dirname = path.resolve();

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: [process.env.FRONTEND_URL, "http://localhost:5173"],
    credentials: true,
  })
);

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/groups", groupRoutes);

// Update the static file serving path
if (process.env.NODE_ENV === "production") {
  // Make sure path is correct
  const frontendPath = path.join(__dirname, "../../../frontend/dist");
  console.log("Serving frontend from:", frontendPath);
  
  app.use(express.static(frontendPath));

  app.get("*", (req, res) => {
    res.sendFile(path.join(frontendPath, "index.html"));
  });
}

server.listen(PORT, () => {
  console.log("server is running on PORT:" + PORT);
  connectDB();
});

console.log("Starting server...");
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("Current directory:", __dirname);

// Also add try-catch to your static file serving code
if (process.env.NODE_ENV === "production") {
  try {
    const frontendPath = path.join(__dirname, "../../frontend/dist");
    console.log("Frontend path:", frontendPath);
    console.log("Frontend path exists:", fs.existsSync(frontendPath));
    
    app.use(express.static(frontendPath));
    
    app.get("*", (req, res) => {
      try {
        const indexPath = path.join(frontendPath, "index.html");
        console.log("Index path:", indexPath);
        console.log("Index file exists:", fs.existsSync(indexPath));
        res.sendFile(indexPath);
      } catch (error) {
        console.error("Error serving index.html:", error);
        res.status(500).send("Error serving frontend");
      }
    });
  } catch (error) {
    console.error("Error setting up static file serving:", error);
  }
}