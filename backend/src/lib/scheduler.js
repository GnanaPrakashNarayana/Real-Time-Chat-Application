// backend/src/lib/scheduler.js - COMPLETE REVISED FILE
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
  
  // Add function to process a specific message
  global.processSpecificMessage = async (scheduledMessage) => {
    try {
      console.log(`🔍 Manually processing specific message: ${scheduledMessage._id}`);
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
  
  return job; // Return the job for potential management later
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
    console.log(`⏰ Timezone: ${now.toString()}`); // Log timezone info for debugging
    
    // Include all messages scheduled for now or earlier that are still in 'scheduled' status
    const messagesToSend = await ScheduledMessage.find({
      scheduledFor: { $lte: now },
      status: "scheduled"
    }).sort({ scheduledFor: 1 }); // Process oldest first
    
    if (messagesToSend.length > 0) {
      console.log(`📨 Found ${messagesToSend.length} scheduled messages to send`);
      
      // Log the IDs for debugging
      console.log(`📨 Message IDs: ${messagesToSend.map(m => m._id).join(', ')}`);
      
      // Process each message
      for (const scheduledMessage of messagesToSend) {
        try {
          console.log(`🔄 Starting to process message: ${scheduledMessage._id}`);
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
      
      // Look for any messages that might have been missed
      if (isManualRun) {
        // Find messages scheduled for more than 1 minute ago that are still pending
        const missedMessages = await ScheduledMessage.find({
          scheduledFor: { $lte: new Date(now.getTime() - 60000) }, 
          status: "scheduled"
        }).sort({ scheduledFor: 1 });
        
        if (missedMessages.length > 0) {
          console.warn(`⚠️ Found ${missedMessages.length} potentially missed messages from earlier - will process them`);
          
          // Actually process the missed messages
          for (const missedMessage of missedMessages) {
            try {
              console.log(`🔄 Processing missed message: ${missedMessage._id}`);
              await sendScheduledMessage(missedMessage);
              schedulerStats.messagesProcessed++;
            } catch (error) {
              schedulerStats.messagesFailed++;
              console.error(`❌ Error sending missed message ${missedMessage._id}:`, error);
              
              // Mark as failed but continue with other messages
              missedMessage.status = "failed";
              await missedMessage.save();
            }
          }
        }
      }
    }
  } catch (error) {
    console.error("❌ Error in scheduler:", error);
    throw error; // Re-throw for the caller to handle
  }
};

const sendScheduledMessage = async (scheduledMessage) => {
  console.log(`🚀 Processing scheduled message: ${scheduledMessage._id} (scheduled for ${scheduledMessage.scheduledFor.getTime()})`);
  
  // Validate message content
  if (!scheduledMessage.text && !scheduledMessage.image && 
      !scheduledMessage.document && !scheduledMessage.voiceMessage) {
    console.warn(`⚠️ Message ${scheduledMessage._id} has no content - marking as failed`);
    scheduledMessage.status = "failed";
    await scheduledMessage.save();
    throw new Error("Message has no content");
  }
  
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
  
  // Create a new direct message with explicit property checks
  const messagePayload = {
    senderId: scheduledMessage.senderId,
    receiverId: scheduledMessage.receiverId
  };
  
  // Only add properties if they exist and are not null/undefined
  if (scheduledMessage.text) {
    messagePayload.text = scheduledMessage.text;
  }
  
  if (scheduledMessage.image) {
    messagePayload.image = scheduledMessage.image;
  }
  
  // Don't add these fields if they're null/undefined
  if (scheduledMessage.document && typeof scheduledMessage.document === 'object') {
    messagePayload.document = scheduledMessage.document;
  }
  
  // Only add voiceMessage if it's an object with required properties
  if (scheduledMessage.voiceMessage && 
      typeof scheduledMessage.voiceMessage === 'object' && 
      scheduledMessage.voiceMessage !== null &&
      scheduledMessage.voiceMessage.url &&
      scheduledMessage.voiceMessage.duration) {
    messagePayload.voiceMessage = scheduledMessage.voiceMessage;
  }
  
  // Create the new message with our safe payload
  console.log(`📦 Message payload prepared:`, JSON.stringify(messagePayload));
  const newMessage = new Message(messagePayload);
  
  // Save with detailed error logging
  try {
    console.log(`💾 Attempting to save direct message to database...`);
    await newMessage.save();
    console.log(`💾 Direct message saved with ID: ${newMessage._id}`);
  } catch (saveError) {
    console.error(`💾 Failed to save direct message:`, saveError);
    throw saveError;
  }
  
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
  
  // ↩ NEW: Also notify the **sender** so their UI updates without a manual refresh
  const senderSocketId = getReceiverSocketId(scheduledMessage.senderId);
  if (senderSocketId) {
    try {
      io.to(senderSocketId).emit("newMessage", populatedMessage);
    } catch (socketError) {
      console.error("⚠️ Socket emission error to sender:", socketError);
    }
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
  
  // Verify sender is still a member of the group
  const isMember = group.members.some(
    memberId => memberId.toString() === scheduledMessage.senderId.toString()
  );
  
  if (!isMember) {
    throw new Error(`Sender ${scheduledMessage.senderId} is no longer a member of group ${scheduledMessage.groupId}`);
  }
  
  // Create a new group message with explicit property checks
  const messagePayload = {
    senderId: scheduledMessage.senderId,
    groupId: scheduledMessage.groupId,
    readBy: [scheduledMessage.senderId] // Mark as read by sender
  };
  
  // Only add properties if they exist and are not null/undefined
  if (scheduledMessage.text) {
    messagePayload.text = scheduledMessage.text;
  }
  
  if (scheduledMessage.image) {
    messagePayload.image = scheduledMessage.image;
  }
  
  // Don't add these fields if they're null/undefined
  if (scheduledMessage.document && typeof scheduledMessage.document === 'object') {
    messagePayload.document = scheduledMessage.document;
  }
  
  // Only add voiceMessage if it's an object with required properties
  if (scheduledMessage.voiceMessage && 
      typeof scheduledMessage.voiceMessage === 'object' && 
      scheduledMessage.voiceMessage !== null &&
      scheduledMessage.voiceMessage.url &&
      scheduledMessage.voiceMessage.duration) {
    messagePayload.voiceMessage = scheduledMessage.voiceMessage;
  }
  
  // Create the new message with our safe payload
  console.log(`📦 Group message payload prepared:`, JSON.stringify(messagePayload));
  const newGroupMessage = new GroupMessage(messagePayload);
  
  // Save with detailed error logging
  try {
    console.log(`💾 Attempting to save group message to database...`);
    await newGroupMessage.save();
    console.log(`💾 Group message saved with ID: ${newGroupMessage._id}`);
  } catch (saveError) {
    console.error(`💾 Failed to save group message:`, saveError);
    throw saveError;
  }
  
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