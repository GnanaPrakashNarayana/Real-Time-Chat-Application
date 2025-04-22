// backend/src/lib/scheduler.js
import ScheduledMessage from "../models/scheduledMessage.model.js";
import Message from "../models/message.model.js";
import GroupMessage from "../models/groupMessage.model.js";
import Group from "../models/group.model.js";
import { io, getReceiverSocketId } from "./socket.js";
import cron from "node-cron";

// Check for scheduled messages every minute
const initScheduler = () => {
  console.log("Starting message scheduler...");
  
  cron.schedule("* * * * *", async () => {
    try {
      const now = new Date();
      
      // Find scheduled messages due to be sent
      const messagesToSend = await ScheduledMessage.find({
        scheduledFor: { $lte: now },
        status: "scheduled"
      }).populate("senderId", "fullName profilePic");
      
      if (messagesToSend.length > 0) {
        console.log(`Found ${messagesToSend.length} scheduled messages to send`);
        
        // Process each message
        for (const scheduledMessage of messagesToSend) {
          await sendScheduledMessage(scheduledMessage);
        }
      }
    } catch (error) {
      console.error("Error in scheduler:", error);
    }
  });
};

const sendScheduledMessage = async (scheduledMessage) => {
  try {
    // Check if it's a direct message or group message
    if (scheduledMessage.receiverId) {
      // Create a new direct message
      const newMessage = new Message({
        senderId: scheduledMessage.senderId._id,
        receiverId: scheduledMessage.receiverId,
        text: scheduledMessage.text,
        image: scheduledMessage.image,
        document: scheduledMessage.document,
        voiceMessage: scheduledMessage.voiceMessage,
      });
      
      await newMessage.save();
      
      // Update scheduled message status
      scheduledMessage.status = "sent";
      scheduledMessage.sentAt = new Date();
      await scheduledMessage.save();
      
      // Notify recipient via socket
      const receiverSocketId = getReceiverSocketId(scheduledMessage.receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("newMessage", {
          ...newMessage.toObject(),
          senderId: scheduledMessage.senderId
        });
      }
      
    } else if (scheduledMessage.groupId) {
      // Create a new group message
      const newGroupMessage = new GroupMessage({
        senderId: scheduledMessage.senderId._id,
        groupId: scheduledMessage.groupId,
        text: scheduledMessage.text,
        image: scheduledMessage.image,
        document: scheduledMessage.document,
        voiceMessage: scheduledMessage.voiceMessage,
        readBy: [scheduledMessage.senderId._id], // Mark as read by sender
      });
      
      await newGroupMessage.save();
      
      // Update scheduled message status
      scheduledMessage.status = "sent";
      scheduledMessage.sentAt = new Date();
      await scheduledMessage.save();
      
      // Notify group members
      const group = await Group.findById(scheduledMessage.groupId);
      
      if (group) {
        group.members.forEach((memberId) => {
          if (memberId.toString() !== scheduledMessage.senderId._id.toString()) {
            const socketId = getReceiverSocketId(memberId);
            if (socketId) {
              io.to(socketId).emit("newGroupMessage", {
                message: {
                  ...newGroupMessage.toObject(),
                  senderId: scheduledMessage.senderId
                },
                group: {
                  _id: group._id,
                  name: group.name,
                  groupPic: group.groupPic
                }
              });
            }
          }
        });
      }
    }
    
    console.log(`Successfully sent scheduled message ${scheduledMessage._id}`);
    
  } catch (error) {
    console.error(`Error sending scheduled message ${scheduledMessage._id}:`, error);
    
    // Mark as failed
    scheduledMessage.status = "failed";
    await scheduledMessage.save();
  }
};

export default initScheduler;