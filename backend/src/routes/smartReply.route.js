// backend/src/routes/smartReply.route.js
import express from "express";
import { getSmartReplies } from "../controllers/smartReply.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/generate", protectRoute, getSmartReplies);

export default router;