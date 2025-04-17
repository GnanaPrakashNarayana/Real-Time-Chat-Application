// backend/src/controllers/poll.controller.js
import Poll from "../models/poll.model.js";
import GroupMessage from "../models/groupMessage.model.js";
import Group from "../models/group.model.js";
import { io, getReceiverSocketId } from "../lib/socket.js";

// Create a new poll
export const createPoll = async (req, res) => {
  try {
    const { groupId, question, options } = req.body;
    const userId = req.user._id;

    // Check if user is a member of the group
    const group = await Group.findOne({ _id: groupId, members: userId });
    if (!group) {
      return res.status(403).json({ message: "You are not a member of this group" });
    }

    // Create a new group message for the poll
    const pollMessage = new GroupMessage({
      groupId,
      senderId: userId,
      text: `Poll: ${question}`, // Default text to show in chat
    });

    await pollMessage.save();

    // Create the poll with the message ID
    const poll = new Poll({
      groupId,
      messageId: pollMessage._id,
      question,
      options: options.map(optionText => ({ text: optionText, votes: [] })),
      creator: userId,
    });

    await poll.save();

    // Update the message with the poll reference
    pollMessage.poll = poll._id;
    await pollMessage.save();

    // Populate creator and votes information for the response
    const populatedPoll = await Poll.findById(poll._id)
      .populate("creator", "fullName profilePic")
      .populate("options.votes", "fullName profilePic");

    // Make sure the options array is properly formatted
    populatedPoll.options = populatedPoll.options.map(option => ({
      ...option.toObject(),
      votes: option.votes || []
    }));

    // Populate the message with sender and poll information
    const populatedMessage = await GroupMessage.findById(pollMessage._id)
      .populate("senderId", "fullName profilePic")
      .populate({
        path: "poll",
        populate: [
          { path: "creator", select: "fullName profilePic" },
          { path: "options.votes", select: "fullName profilePic" }
        ]
      });

    // Notify all group members about the new poll
    group.members.forEach((memberId) => {
      if (memberId.toString() !== userId.toString()) {
        const socketId = getReceiverSocketId(memberId);
        if (socketId) {
          io.to(socketId).emit("newGroupMessage", {
            message: populatedMessage,
            group: {
              _id: group._id,
              name: group.name,
              groupPic: group.groupPic
            }
          });
        }
      }
    });

    res.status(201).json(populatedMessage);
  } catch (error) {
    console.log("Error in createPoll controller:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Vote on a poll
export const votePoll = async (req, res) => {
  try {
    const { pollId, optionId } = req.body;
    const userId = req.user._id;

    // Get the poll
    const poll = await Poll.findById(pollId);
    if (!poll) {
      return res.status(404).json({ message: "Poll not found" });
    }

    // Check if the poll is active
    if (!poll.isActive) {
      return res.status(400).json({ message: "This poll is no longer active" });
    }

    // Check if the user has already voted
    if (poll.hasUserVoted(userId)) {
      // Remove user's previous vote
      for (const option of poll.options) {
        const voteIndex = option.votes.findIndex(
          voteId => voteId.toString() === userId.toString()
        );
        if (voteIndex !== -1) {
          option.votes.splice(voteIndex, 1);
        }
      }
    }

    // Add user's vote to the selected option
    const option = poll.options.id(optionId);
    if (!option) {
      return res.status(404).json({ message: "Option not found" });
    }
    option.votes.push(userId);

    await poll.save();

    // Get the group message this poll belongs to
    const message = await GroupMessage.findById(poll.messageId);
    if (!message) {
      return res.status(404).json({ message: "Associated message not found" });
    }

    // Populate the poll with creator and votes information
    const populatedPoll = await Poll.findById(poll._id)
      .populate("creator", "fullName profilePic")
      .populate("options.votes", "fullName profilePic");

    // Make sure the options array is properly formatted in the response
    populatedPoll.options = populatedPoll.options.map(option => ({
      ...option.toObject(),
      votes: option.votes || []
    }));

    // Get the group
    const group = await Group.findById(poll.groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Notify all group members about the vote
    group.members.forEach((memberId) => {
      const socketId = getReceiverSocketId(memberId);
      if (socketId) {
        io.to(socketId).emit("pollVote", {
          poll: populatedPoll,
          voter: {
            _id: userId,
            optionId
          },
          groupId: group._id,
          messageId: message._id
        });
      }
    });

    res.status(200).json(populatedPoll);
  } catch (error) {
    console.log("Error in votePoll controller:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// End a poll (only creator can end)
export const endPoll = async (req, res) => {
  try {
    const { pollId } = req.params;
    const userId = req.user._id;

    // Get the poll
    const poll = await Poll.findById(pollId);
    if (!poll) {
      return res.status(404).json({ message: "Poll not found" });
    }

    // Check if the user is the creator
    if (poll.creator.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Only the poll creator can end this poll" });
    }

    // End the poll
    poll.isActive = false;
    await poll.save();

    // Populate the poll with creator and votes information
    const populatedPoll = await Poll.findById(poll._id)
      .populate("creator", "fullName profilePic")
      .populate("options.votes", "fullName profilePic");

    // Make sure the options array is properly formatted
    populatedPoll.options = populatedPoll.options.map(option => ({
      ...option.toObject(),
      votes: option.votes || []
    }));

    // Get the group
    const group = await Group.findById(poll.groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Notify all group members that the poll has ended
    group.members.forEach((memberId) => {
      const socketId = getReceiverSocketId(memberId);
      if (socketId) {
        io.to(socketId).emit("pollEnded", {
          poll: populatedPoll,
          groupId: group._id,
          messageId: poll.messageId
        });
      }
    });

    res.status(200).json(populatedPoll);
  } catch (error) {
    console.log("Error in endPoll controller:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get poll results
export const getPollResults = async (req, res) => {
  try {
    const { pollId } = req.params;
    const userId = req.user._id;

    // Get the poll with populated creator and votes
    const poll = await Poll.findById(pollId)
      .populate("creator", "fullName profilePic")
      .populate("options.votes", "fullName profilePic");

    if (!poll) {
      return res.status(404).json({ message: "Poll not found" });
    }

    // Check if user is a member of the group
    const group = await Group.findOne({ _id: poll.groupId, members: userId });
    if (!group) {
      return res.status(403).json({ message: "You are not a member of this group" });
    }

    const formattedPoll = {
        ...poll.toObject(),
        options: poll.options.map(option => ({
          ...option,
          votes: Array.isArray(option.votes) ? option.votes : []
        }))
      };
      

    res.status(200).json(formattedPoll);
  } catch (error) {
    console.log("Error in getPollResults controller:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};