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
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Method to check if a user has voted
pollSchema.methods.hasUserVoted = function(userId) {
  for (const option of this.options) {
    if (option.votes.some(vote => vote.toString() === userId.toString())) {
      return true;
    }
  }
  return false;
};

// Method to get the option a user voted for
pollSchema.methods.getUserVote = function(userId) {
  for (const option of this.options) {
    if (option.votes.some(vote => vote.toString() === userId.toString())) {
      return option._id;
    }
  }
  return null;
};

// Method to get total votes
pollSchema.methods.getTotalVotes = function() {
  return this.options.reduce((total, option) => total + option.votes.length, 0);
};

// Add pre-find hooks to always populate creator and votes
pollSchema.pre('find', function(next) {
  this.populate('creator', 'fullName profilePic');
  this.populate('options.votes', 'fullName profilePic');
  next();
});

pollSchema.pre('findOne', function(next) {
  this.populate('creator', 'fullName profilePic');
  this.populate('options.votes', 'fullName profilePic');
  next();
});

// Also add a pre-hook for findById since it's commonly used
pollSchema.pre('findById', function(next) {
  this.populate('creator', 'fullName profilePic');
  this.populate('options.votes', 'fullName profilePic');
  next();
});

// Adding a custom method to ensure options are always properly formatted
pollSchema.methods.ensureOptionsFormat = function() {
  return {
    ...this.toObject(),
    options: this.options.map(option => ({
      ...option.toObject(),
      votes: Array.isArray(option.votes) ? option.votes : []
    }))
  };
};

const Poll = mongoose.model("Poll", pollSchema);

export default Poll;