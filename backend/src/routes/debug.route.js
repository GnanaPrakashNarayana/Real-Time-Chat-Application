// backend/src/routes/debug.route.js
import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { getSchedulerStatus } from "../lib/scheduler.js";
import ScheduledMessage from "../models/scheduledMessage.model.js";

const router = express.Router();

// Debugging endpoint to get scheduler status
router.get("/scheduler-status", protectRoute, (req, res) => {
  try {
    const status = getSchedulerStatus();
    res.status(200).json(status);
  } catch (error) {
    console.error("Error getting scheduler status:", error);
    res.status(500).json({ error: "Error getting scheduler status" });
  }
});

// Endpoint to manually trigger scheduler
router.post("/trigger-scheduler", protectRoute, async (req, res) => {
  try {
    if (typeof global.triggerScheduler !== "function") {
      return res.status(500).json({ 
        error: "Scheduler trigger function not available",
        info: "Server may need to be restarted"
      });
    }
    
    const result = await global.triggerScheduler();
    res.status(200).json({ 
      success: true, 
      message: "Scheduler manually triggered",
      stats: result
    });
  } catch (error) {
    console.error("Error triggering scheduler:", error);
    res.status(500).json({ error: "Error triggering scheduler" });
  }
});

// New endpoint to directly process messages by their IDs
router.post("/process-scheduled-message/:id", protectRoute, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find the message
    const message = await ScheduledMessage.findById(id);
    if (!message) {
      return res.status(404).json({ error: "Scheduled message not found" });
    }
    
    // Manually trigger the global function for this message
    if (typeof global.processSpecificMessage !== "function") {
      return res.status(500).json({ 
        error: "Direct message processing function not available",
        info: "Server may need to be updated" 
      });
    }
    
    const result = await global.processSpecificMessage(message);
    
    res.status(200).json({
      success: true,
      message: "Message processing attempted",
      result
    });
  } catch (error) {
    console.error("Error processing specific message:", error);
    res.status(500).json({ error: "Error processing message" });
  }
});

// backend/src/routes/debug.route.js  (add at bottom)
/* router.get('/scheduled-pending', protectRoute, async (_req, res) => {
    const pending = await ScheduledMessage.find({ status: 'scheduled' })
      .select('-__v')
      .sort({ scheduledFor: 1 });
    res.json(pending);
  }); */ // ← Remove this duplicate definition

// Endpoint to view all pending scheduled messages
router.get("/scheduled-pending", protectRoute, async (req, res) => {
  try {
    const pending = await ScheduledMessage.find({ status: "scheduled" })
      .select("-__v")
      .sort({ scheduledFor: 1 });
    
    // Add current server time for comparison
    const serverTime = new Date();
    
    // Format each message with time difference info
    const formattedMessages = pending.map(msg => {
      const msgObj = msg.toObject();
      const diff = msg.scheduledFor.getTime() - serverTime.getTime();
      const diffMinutes = Math.round(diff / (60 * 1000));
      
      return {
        ...msgObj,
        _timeInfo: {
          serverTimeNow: serverTime.toISOString(),
          diffMs: diff,
          diffMinutes,
          isPast: diff < 0
        }
      };
    });
    
    res.status(200).json({
      serverTime: serverTime.toISOString(),
      count: pending.length,
      messages: formattedMessages
    });
  } catch (error) {
    console.error("Error getting pending scheduled messages:", error);
    res.status(500).json({ error: "Error retrieving pending messages" });
  }
});

export default router;