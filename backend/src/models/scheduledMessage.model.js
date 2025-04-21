// backend/src/models/scheduledMessage.model.js
import mongoose from "mongoose";

const scheduledMessageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Either receiverId or groupId will be set, depending on the message type
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
    },
    text: {
      type: String,
    },
    image: {
      type: String,
    },
    document: {
      url: String,
      name: String,
      type: String,
      size: Number,
    },
    voiceMessage: {
      url: String,
      duration: Number,
    },
    scheduledFor: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["scheduled", "sent", "failed"],
      default: "scheduled",
    },
    sentAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

const ScheduledMessage = mongoose.model("ScheduledMessage", scheduledMessageSchema);

export default ScheduledMessage;