// backend/src/models/poll.model.js
import mongoose from "mongoose";

const pollOptionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
    trim: true,
  },
  votes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }]
});

const pollSchema = new mongoose.Schema(
  {
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: true,
    },
    messageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GroupMessage",
      required: true,
    },
    question: {
      type: String,
      required: true,
      trim: true,
    },
    options: [pollOptionSchema],
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    endDate: {
      type: Date,
      default: null, // null means no end date
    },
    isActive: {
      type: Boolean,
      default: true,
    }
  },
  { timestamps: true }
);

// Method to check if a user has voted
pollSchema.methods.hasUserVoted = function(userId) {
  for (const option of this.options) {
    if (option.votes.includes(userId)) {
      return true;
    }
  }
  return false;
};

// Method to get the option a user voted for
pollSchema.methods.getUserVote = function(userId) {
  for (const option of this.options) {
    if (option.votes.includes(userId)) {
      return option._id;
    }
  }
  return null;
};

// Method to get total votes
pollSchema.methods.getTotalVotes = function() {
  return this.options.reduce((total, option) => total + option.votes.length, 0);
};

const Poll = mongoose.model("Poll", pollSchema);

export default Poll;