import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { sendMessageToHelper, getChatHistory } from "../controllers/helper.controller.js";

const router = express.Router();

router.post("/chat", protectRoute, sendMessageToHelper);
router.get("/history", protectRoute, getChatHistory);

export default router;