// backend/src/routes/group.route.js
import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  addMembersToGroup,
  createGroup,
  getGroupMessages,
  getGroups,
  removeMemberFromGroup,
  sendGroupMessage
} from "../controllers/group.controller.js";

const router = express.Router();

router.post("/create", protectRoute, createGroup);
router.get("/", protectRoute, getGroups);
router.get("/messages/:id", protectRoute, getGroupMessages);
router.post("/messages/:id", protectRoute, sendGroupMessage);
router.post("/members", protectRoute, addMembersToGroup);
router.delete("/:groupId/members/:memberId", protectRoute, removeMemberFromGroup);
router.post("/messages/react/:id", protectRoute, reactToGroupMessage);

export default router;