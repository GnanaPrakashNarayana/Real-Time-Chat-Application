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

// Add a method to get vote count
pollOptionSchema.methods.getVoteCount = function() {
  return Array.isArray(this.votes) ? this.votes.length : 0;
};

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

// Add a virtual for total votes
pollSchema.virtual('totalVotes').get(function() {
  if (!this.options || !Array.isArray(this.options)) return 0;
  
  return this.options.reduce((total, option) => {
    return total + (Array.isArray(option.votes) ? option.votes.length : 0);
  }, 0);
});

// Method to check if a user has voted
pollSchema.methods.hasUserVoted = function(userId) {
  if (!userId) return false;
  
  // Convert to string for consistent comparison
  const userIdStr = userId.toString();
  
  for (const option of this.options) {
    if (!Array.isArray(option.votes)) continue;
    
    if (option.votes.some(vote => {
      return vote.toString() === userIdStr;
    })) {
      return true;
    }
  }
  return false;
};

// Method to get the option a user voted for
pollSchema.methods.getUserVote = function(userId) {
  if (!userId) return null;
  
  // Convert to string for consistent comparison
  const userIdStr = userId.toString();
  
  for (const option of this.options) {
    if (!Array.isArray(option.votes)) continue;
    
    if (option.votes.some(vote => vote.toString() === userIdStr)) {
      return option._id;
    }
  }
  return null;
};

// Method to check if a user is the creator
pollSchema.methods.isCreator = function(userId) {
  if (!userId || !this.creator) return false;
  return this.creator.toString() === userId.toString();
};

// Add pre-find hooks to populate creator and votes
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

// Add a pre-hook for findById since it's commonly used
pollSchema.pre('findById', function(next) {
  this.populate('creator', 'fullName profilePic');
  this.populate('options.votes', 'fullName profilePic');
  next();
});

// Method to safely format options for frontend
pollSchema.methods.formatForClient = function() {
  return {
    ...this.toObject(),
    options: this.options.map(option => ({
      ...option.toObject(),
      votes: Array.isArray(option.votes) ? option.votes : [],
      voteCount: option.votes.length || 0
    })),
    totalVotes: this.totalVotes
  };
};

const Poll = mongoose.model("Poll", pollSchema);

export default Poll;