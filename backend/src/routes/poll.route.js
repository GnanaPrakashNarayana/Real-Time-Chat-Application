// backend/src/routes/poll.route.js
import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { 
  createPoll, 
  votePoll, 
  endPoll, 
  getPollResults 
} from "../controllers/poll.controller.js";

const router = express.Router();

router.post("/create", protectRoute, createPoll);
router.post("/vote", protectRoute, votePoll);
router.put("/end/:pollId", protectRoute, endPoll);
router.get("/:pollId", protectRoute, getPollResults);

export default router;