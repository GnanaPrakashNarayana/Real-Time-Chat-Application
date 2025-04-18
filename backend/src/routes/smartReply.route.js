// Updated backend/src/routes/smartReply.route.js
import express from "express";
import { getSmartReplies, getSmartRepliesWithContext } from "../controllers/smartReply.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/generate", protectRoute, getSmartReplies);
router.post("/generate-with-context", protectRoute, getSmartRepliesWithContext);

export default router;