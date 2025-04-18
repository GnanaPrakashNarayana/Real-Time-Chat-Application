// backend/src/index.js
import dotenv from "dotenv";
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import * as fs from "fs";

import { connectDB } from "./lib/db.js";
import { app, server } from "./lib/socket.js";   // ← app comes from socket.js
import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import groupRoutes from "./routes/group.route.js";
import helperRoutes from "./routes/helper.route.js";
import pollRoutes from "./routes/poll.route.js";
import smartReplyRoutes from "./routes/smartReply.route.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);
dotenv.config();

const PORT = process.env.PORT || 5002;

/* -------------------------------------------------------------------------- */
/*                               C O R S                                      */
/* -------------------------------------------------------------------------- */
const WHITELIST = [
  "https://chatterpillar.netlify.app",
  "http://localhost:5173",
  process.env.FRONTEND_URL,          // optional extra
];

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);            // Postman / server‑side
      return WHITELIST.includes(origin)
        ? cb(null, true)
        : cb(new Error(`CORS: ${origin} not allowed`));
    },
    credentials: true,
  })
);

// Pre‑flight
app.options("*", cors());

/* -------------------------------------------------------------------------- */
/*                             M I D D L E W A R E                            */
/* -------------------------------------------------------------------------- */
app.use(express.json({ limit: "50mb" }));
app.use(cookieParser());

/* -------------------------------------------------------------------------- */
/*                                 R O U T E S                                */
/* -------------------------------------------------------------------------- */

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/polls", pollRoutes);
app.use("/api/smart-replies", smartReplyRoutes);
app.use("/api/ai", helperRoutes);

/* simple uptime check */
app.get("/api/health", (_, res) => res.json({ status: "ok" }));

/* -------------------------------------------------------------------------- */
/*                      S T A T I C   F R O N T E N D                         */
/* -------------------------------------------------------------------------- */
if (process.env.NODE_ENV === "production") {
  const frontendPath = "/opt/render/project/src/frontend/dist";
  if (fs.existsSync(frontendPath)) {
    app.use(express.static(frontendPath));
    app.get("*", (_, res) =>
      res.sendFile(path.join(frontendPath, "index.html"))
    );
  }
}

/* -------------------------------------------------------------------------- */
/*                                S T A R T                                   */
/* -------------------------------------------------------------------------- */
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  connectDB();
});