// backend/src/routes/scheduledMessage.route.js
import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  createScheduledMessage,
  getScheduledMessages,
  deleteScheduledMessage,
  updateScheduledMessage
} from "../controllers/scheduledMessage.controller.js";

const router = express.Router();

router.post("/", protectRoute, createScheduledMessage);
router.get("/", protectRoute, getScheduledMessages);
router.delete("/:id", protectRoute, deleteScheduledMessage);
router.put("/:id", protectRoute, updateScheduledMessage);

export default router;