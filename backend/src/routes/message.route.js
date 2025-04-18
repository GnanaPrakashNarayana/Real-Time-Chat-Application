// backend/src/routes/message.route.js
import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  getUsersForSidebar,
  getMessages,
  getConversationSummary,   // ✨ new
  sendMessage,
  markMessagesAsRead,
  reactToMessage,
} from "../controllers/message.controller.js";

const router = express.Router();

/* ───────── sidebar + chat ───────── */
router.get("/users", protectRoute, getUsersForSidebar);
router.get("/:id", protectRoute, getMessages);

/* ───────── NEW summary endpoint ──── */
router.get("/summary/:id", protectRoute, getConversationSummary);

/* ───────── messaging actions ─────── */
router.post("/send/:id", protectRoute, sendMessage);
router.put("/read/:id", protectRoute, markMessagesAsRead);
router.post("/react/:id", protectRoute, reactToMessage);

export default router;