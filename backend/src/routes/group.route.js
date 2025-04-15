import express from "express";
import Group from "../models/group.model.js";
const router = express.Router();

// Create a new group chat
router.post("/", async (req, res) => {
  try {
    const { name, admin, members } = req.body;
    const newGroup = new Group({ name, admin, members });
    await newGroup.save();
    res.status(201).json(newGroup);
  } catch (error) {
    res.status(500).json({ error: "Failed to create group chat" });
  }
});

// Add a user to an existing group chat
router.post("/:groupId/add-user", async (req, res) => {
  try {
    const { userId } = req.body;
    const group = await Group.findById(req.params.groupId);
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }
    group.members.push(userId);
    await group.save();
    res.json(group);
  } catch (error) {
    res.status(500).json({ error: "Failed to add user to group" });
  }
});

export default router;