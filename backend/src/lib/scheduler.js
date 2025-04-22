// backend/src/lib/scheduler.js
import ScheduledMessage from "../models/scheduledMessage.model.js";
import Message from "../models/message.model.js";
import GroupMessage from "../models/groupMessage.model.js";
import Group from "../models/group.model.js";
import User from "../models/user.model.js";
import { io, getReceiverSocketId } from "./socket.js";
import cron from "node-cron";

// Check for scheduled messages every minute
const initScheduler = () => {
  console.log("🕒 Starting message scheduler...");
  
  // Run every minute
  cron.schedule("* * * * *", async () => {
    await processScheduledMessages();
  });
  
  // Also process any pending messages immediately on startup
  setTimeout(async () => {
    console.log("🔄 Processing any pending scheduled messages on startup...");
    await processScheduledMessages();
  }, 5000); // Wait 5 seconds after server start
};

// Main function to process all scheduled messages
const processScheduledMessages = async () => {
  try {
    const now = new Date();
    console.log(`⏰ Checking for scheduled messages at ${now.toISOString()}`);
    
    // Find scheduled messages due to be sent
    const messagesToSend = await ScheduledMessage.find({
      scheduledFor: { $lte: now },
      status: "scheduled"
    });
    
    if (messagesToSend.length > 0) {
      console.log(`📨 Found ${messagesToSend.length} scheduled messages to send`);
      
      // Process each message
      for (const scheduledMessage of messagesToSend) {
        try {
          await sendScheduledMessage(scheduledMessage);
        } catch (error) {
          console.error(`❌ Error sending scheduled message ${scheduledMessage._id}:`, error);
          // Mark as failed but continue with other messages
          scheduledMessage.status = "failed";
          await scheduledMessage.save();
        }
      }
    } else {
      console.log("👍 No pending scheduled messages found");
    }
  } catch (error) {
    console.error("❌ Error in scheduler:", error);
  }
};

const sendScheduledMessage = async (scheduledMessage) => {
  console.log(`🚀 Processing scheduled message: ${scheduledMessage._id}`);
  
  try {
    // Check if it's a direct message or group message
    if (scheduledMessage.receiverId) {
      await sendDirectMessage(scheduledMessage);
    } else if (scheduledMessage.groupId) {
      await sendGroupMessage(scheduledMessage);
    } else {
      throw new Error("Invalid message: no receiverId or groupId");
    }
    
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
  
  // Update scheduled message status
  scheduledMessage.status = "sent";
  scheduledMessage.sentAt = new Date();
  await scheduledMessage.save();
  
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
    io.to(receiverSocketId).emit("newMessage", populatedMessage);
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
  
  // Update scheduled message status
  scheduledMessage.status = "sent";
  scheduledMessage.sentAt = new Date();
  await scheduledMessage.save();
  
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
    group.members.forEach((memberId) => {
      if (memberId.toString() !== scheduledMessage.senderId.toString()) {
        const socketId = getReceiverSocketId(memberId);
        if (socketId) {
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
        }
      }
    });
  }
  
  console.log(`📊 Notified ${notificationsSent} online group members`);
};

export default initScheduler;