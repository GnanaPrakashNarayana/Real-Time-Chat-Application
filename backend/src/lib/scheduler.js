// backend/src/lib/scheduler.js
import ScheduledMessage from "../models/scheduledMessage.model.js";
import Message from "../models/message.model.js";
import GroupMessage from "../models/groupMessage.model.js";
import Group from "../models/group.model.js";
import User from "../models/user.model.js";
import { io, getReceiverSocketId } from "./socket.js";
import cron from "node-cron";

// Keep track of scheduler state for debugging
let lastRun = null;
let isCurrentlyRunning = false;
let schedulerStats = {
  totalRuns: 0,
  successfulRuns: 0,
  failedRuns: 0,
  messagesProcessed: 0,
  messagesFailed: 0,
  lastErrorMessage: null,
  lastErrorTimestamp: null
};

// Check for scheduled messages every minute
const initScheduler = () => {
  console.log("🕒 Starting message scheduler...");
  
  // Run every minute
  const job = cron.schedule("* * * * *", async () => {
    await runSchedulerTask();
  });
  
  // Make sure the job is running
  if (!job.running) {
    console.error("⚠️ Scheduler job is not running!");
    job.start();
  }
  
  // Also process any pending messages immediately on startup - with a delay to ensure DB connection is established
  setTimeout(async () => {
    console.log("🔄 Processing any pending scheduled messages on startup...");
    await runSchedulerTask(true);
  }, 5000); // Wait 5 seconds after server start

  // Export a function to manually trigger the scheduler (useful for testing)
  global.triggerScheduler = async () => {
    console.log("🔔 Manually triggering scheduler...");
    await runSchedulerTask(true);
    return schedulerStats;
  };
  
  return job; // Return the job for potential management later
};
// Add this after initScheduler function in scheduler.js
// Global function to process a specific message
global.processSpecificMessage = async (scheduledMessage) => {
  try {
    console.log(`🔍 Manually processing specific message: ${scheduledMessage._id}`);
    
    // Process the message
    await sendScheduledMessage(scheduledMessage);
    
    return {
      success: true,
      messageId: scheduledMessage._id,
      timestamp: new Date()
    };
  } catch (error) {
    console.error(`⚠️ Error processing specific message:`, error);
    return {
      success: false, 
      error: error.message,
      messageId: scheduledMessage._id,
      timestamp: new Date()
    };
  }
};

// Wrapper function to handle scheduler execution with error handling and stats
const runSchedulerTask = async (isManualRun = false) => {
  // Prevent concurrent runs
  if (isCurrentlyRunning) {
    console.log("⏳ Scheduler already running, skipping this run");
    return;
  }
  
  isCurrentlyRunning = true;
  lastRun = new Date();
  schedulerStats.totalRuns++;
  
  try {
    await processScheduledMessages(isManualRun);
    schedulerStats.successfulRuns++;
  } catch (error) {
    schedulerStats.failedRuns++;
    schedulerStats.lastErrorMessage = error.message;
    schedulerStats.lastErrorTimestamp = new Date();
    console.error("❌ Error in scheduler task:", error);
  } finally {
    isCurrentlyRunning = false;
  }
};

// Main function to process all scheduled messages
const processScheduledMessages = async (isManualRun = false) => {
  try {
    const now = new Date();
    console.log(`⏰ Checking for scheduled messages at ${now.toISOString()}${isManualRun ? ' (MANUAL RUN)' : ''}`);
    
    // Find scheduled messages due to be sent - with a safety margin to account for slight delays
    const cutoffTime = new Date(now.getTime() + 60000); // Add 1 minute buffer
    
    const messagesToSend = await ScheduledMessage.find({
      scheduledFor: { $lte: now },
      status: "scheduled"
    }).sort({ scheduledFor: 1 }); // Process oldest first
    
    if (messagesToSend.length > 0) {
      console.log(`📨 Found ${messagesToSend.length} scheduled messages to send`);
      
      // Process each message
      for (const scheduledMessage of messagesToSend) {
        try {
          await sendScheduledMessage(scheduledMessage);
          schedulerStats.messagesProcessed++;
        } catch (error) {
          schedulerStats.messagesFailed++;
          console.error(`❌ Error sending scheduled message ${scheduledMessage._id}:`, error);
          
          // Mark as failed but continue with other messages
          scheduledMessage.status = "failed";
          await scheduledMessage.save();
        }
      }
    } else {
      console.log("👍 No pending scheduled messages found");
      
      // Double-check by looking for any messages that might have been missed
      if (isManualRun) {
        // FIX: Use countDocuments() instead of count()
        const missedMessages = await ScheduledMessage.countDocuments({
          scheduledFor: { $lte: new Date(now.getTime() - 60000) }, // Any message scheduled for more than 1 minute ago
          status: "scheduled"
        });
        
        if (missedMessages > 0) {
          console.warn(`⚠️ Found ${missedMessages} potentially missed messages from earlier - will retry`);
        }
      }
    }
  } catch (error) {
    console.error("❌ Error in scheduler:", error);
    throw error; // Re-throw for the caller to handle
  }
};

const sendScheduledMessage = async (scheduledMessage) => {
  console.log(`🚀 Processing scheduled message: ${scheduledMessage._id} (scheduled for ${scheduledMessage.scheduledFor.toISOString()})`);
  
  try {
    // Check if it's a direct message or group message
    if (scheduledMessage.receiverId) {
      await sendDirectMessage(scheduledMessage);
    } else if (scheduledMessage.groupId) {
      await sendGroupMessage(scheduledMessage);
    } else {
      throw new Error("Invalid message: no receiverId or groupId");
    }
    
    // Update scheduled message status
    scheduledMessage.status = "sent";
    scheduledMessage.sentAt = new Date();
    await scheduledMessage.save();
    
    console.log(`✅ Successfully sent scheduled message ${scheduledMessage._id}`);
    
  } catch (error) {
    console.error(`❌ Error sending scheduled message ${scheduledMessage._id}:`, error);
    
    // Mark as failed
    scheduledMessage.status = "failed";
    await scheduledMessage.save();
    throw error; // Re-throw for the caller to handle
  }
};

const sendDirectMessage = async (scheduledMessage) => {
  console.log(`📤 Sending direct message to recipient: ${scheduledMessage.receiverId}`);
  
  // Find sender to ensure they still exist
  const sender = await User.findById(scheduledMessage.senderId).select("fullName profilePic");
  if (!sender) {
    throw new Error(`Sender ${scheduledMessage.senderId} not found`);
  }
  
  // Find receiver to ensure they still exist
  const receiver = await User.findById(scheduledMessage.receiverId);
  if (!receiver) {
    throw new Error(`Receiver ${scheduledMessage.receiverId} not found`);
  }
  
  // Create a new direct message
  const newMessage = new Message({
    senderId: scheduledMessage.senderId,
    receiverId: scheduledMessage.receiverId,
    text: scheduledMessage.text,
    image: scheduledMessage.image,
    document: scheduledMessage.document,
    voiceMessage: scheduledMessage.voiceMessage,
  });
  
  await newMessage.save();
  console.log(`💾 Direct message saved with ID: ${newMessage._id}`);
  
  // Prepare populated message for socket
  const populatedMessage = {
    ...newMessage.toObject(),
    senderId: {
      _id: sender._id,
      fullName: sender.fullName,
      profilePic: sender.profilePic
    }
  };
  
  // Notify recipient via socket
  const receiverSocketId = getReceiverSocketId(scheduledMessage.receiverId);
  if (receiverSocketId) {
    console.log(`📡 Emitting socket event to ${receiverSocketId}`);
    try {
      io.to(receiverSocketId).emit("newMessage", populatedMessage);
      console.log(`📡 Socket event sent successfully`);
    } catch (socketError) {
      console.error(`⚠️ Socket emission error:`, socketError);
      // Continue execution - don't throw - socket delivery is not critical
    }
  } else {
    console.log(`📝 Receiver not online, message will be delivered on next connection`);
  }
};

const sendGroupMessage = async (scheduledMessage) => {
  console.log(`📤 Sending group message to group: ${scheduledMessage.groupId}`);
  
  // Find sender to ensure they still exist
  const sender = await User.findById(scheduledMessage.senderId).select("fullName profilePic");
  if (!sender) {
    throw new Error(`Sender ${scheduledMessage.senderId} not found`);
  }
  
  // Find group to ensure it still exists
  const group = await Group.findById(scheduledMessage.groupId);
  if (!group) {
    throw new Error(`Group ${scheduledMessage.groupId} not found`);
  }
  
  // Create a new group message
  const newGroupMessage = new GroupMessage({
    senderId: scheduledMessage.senderId,
    groupId: scheduledMessage.groupId,
    text: scheduledMessage.text,
    image: scheduledMessage.image,
    document: scheduledMessage.document,
    voiceMessage: scheduledMessage.voiceMessage,
    readBy: [scheduledMessage.senderId], // Mark as read by sender
  });
  
  await newGroupMessage.save();
  console.log(`💾 Group message saved with ID: ${newGroupMessage._id}`);
  
  // Prepare populated message for socket
  const populatedMessage = {
    ...newGroupMessage.toObject(),
    senderId: {
      _id: sender._id,
      fullName: sender.fullName,
      profilePic: sender.profilePic
    }
  };
  
  // Notify group members
  let notificationsSent = 0;
  if (group.members && group.members.length > 0) {
    for (const memberId of group.members) {
      if (memberId.toString() !== scheduledMessage.senderId.toString()) {
        const socketId = getReceiverSocketId(memberId);
        if (socketId) {
          try {
            console.log(`📡 Emitting socket event to group member: ${memberId}`);
            io.to(socketId).emit("newGroupMessage", {
              message: populatedMessage,
              group: {
                _id: group._id,
                name: group.name,
                groupPic: group.groupPic
              }
            });
            notificationsSent++;
          } catch (socketError) {
            console.error(`⚠️ Socket emission error for member ${memberId}:`, socketError);
            // Continue with other members - don't throw
          }
        }
      }
    }
  }
  
  console.log(`📊 Notified ${notificationsSent} online group members`);
};

// Export a method to get scheduler status - useful for debugging
export const getSchedulerStatus = () => {
  return {
    lastRun,
    isCurrentlyRunning,
    stats: schedulerStats
  };
};

export default initScheduler;