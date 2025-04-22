// backend/src/routes/debug.route.js
import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { getSchedulerStatus } from "../lib/scheduler.js";

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

export default router;