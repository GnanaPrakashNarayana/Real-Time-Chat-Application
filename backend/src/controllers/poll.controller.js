// backend/src/controllers/poll.controller.js
import Poll from "../models/poll.model.js";
import GroupMessage from "../models/groupMessage.model.js";
import Group from "../models/group.model.js";
import { io, getReceiverSocketId } from "../lib/socket.js";

/*****************************************************************************************
 *  CREATE A NEW POLL                                                                    *
 *****************************************************************************************/
export const createPoll = async (req, res) => {
  try {
    const { groupId, question, options } = req.body;
    const userId = req.user._id;

    // Verify membership
    const group = await Group.findOne({ _id: groupId, members: userId });
    if (!group) {
      return res.status(403).json({ message: "You are not a member of this group" });
    }

    // Create a placeholder group‑message (so the poll shows up in chat)
    const pollMessage = new GroupMessage({
      groupId,
      senderId: userId,
      text: `Poll: ${question}`,
    });
    await pollMessage.save();

    // Persist the poll
    const poll = new Poll({
      groupId,
      messageId: pollMessage._id,
      question,
      options: options.map((txt) => ({ text: txt, votes: [] })),
      creator: userId,
    });
    await poll.save();

    // Attach poll reference to the message
    pollMessage.poll = poll._id;
    await pollMessage.save();

    // Populate before sending back / over socket
    const populatedPoll = await Poll.findById(poll._id)
      .populate("creator", "fullName profilePic")
      .populate("options.votes", "fullName profilePic");

    const populatedMessage = await GroupMessage.findById(pollMessage._id)
      .populate("senderId", "fullName profilePic")
      .populate({
        path: "poll",
        populate: [
          { path: "creator", select: "fullName profilePic" },
          { path: "options.votes", select: "fullName profilePic" },
        ],
      });

    // Notify other members
    group.members.forEach((memberId) => {
      if (memberId.toString() === userId.toString()) return;
      const socketId = getReceiverSocketId(memberId);
      if (socketId) {
        io.to(socketId).emit("newGroupMessage", {
          message: populatedMessage,
          group: { _id: group._id, name: group.name, groupPic: group.groupPic },
        });
      }
    });

    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error("Error in createPoll controller:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/*****************************************************************************************
 *  VOTE ON A POLL                                                                       *
 *****************************************************************************************/
// Update the votePoll function in backend/src/controllers/poll.controller.js
// backend/src/controllers/poll.controller.js - Update these methods

/*****************************************************************************************
 *  VOTE ON A POLL                                                                       *
 *****************************************************************************************/
export const votePoll = async (req, res) => {
    try {
      const { pollId, optionId } = req.body;
      const userId = req.user._id;
  
      console.log(`Processing vote: User ${userId} voting for option ${optionId} in poll ${pollId}`);
  
      const poll = await Poll.findById(pollId);
      if (!poll) {
        console.log("Poll not found:", pollId);
        return res.status(404).json({ message: "Poll not found" });
      }
      
      if (!poll.isActive) {
        console.log("Poll is no longer active:", pollId);
        return res.status(400).json({ message: "This poll is no longer active" });
      }
  
      console.log("Found poll:", poll._id, "with options:", poll.options.length);
  
      // Find the specific option
      const option = poll.options.id(optionId);
      if (!option) {
        console.log("Option not found in poll:", optionId);
        return res.status(404).json({ message: "Option not found" });
      }
  
      // Convert user ID to string for consistent comparison
      const userIdStr = userId.toString();
  
      // Remove any previous vote by this user from all options
      let userHadPreviousVote = false;
      poll.options.forEach((opt) => {
        const previousVoteIndex = opt.votes.findIndex(
          voteId => voteId.toString() === userIdStr
        );
        
        if (previousVoteIndex >= 0) {
          userHadPreviousVote = true;
          opt.votes.splice(previousVoteIndex, 1);
          console.log(`Removed previous vote from option ${opt._id}`);
        }
      });
  
      // Add new vote to selected option
      option.votes.push(userId);
      console.log(`Added vote to option ${option._id}, new vote count: ${option.votes.length}`);
  
      // Mark the nested path as modified so Mongoose saves the changes
      poll.markModified("options");
      await poll.save();
      console.log("Poll saved successfully");
  
      // Get populated poll with user details
      const populatedPoll = await Poll.findById(poll._id)
        .populate("creator", "fullName profilePic")
        .populate("options.votes", "fullName profilePic");
  
      if (!populatedPoll) {
        console.error("Failed to retrieve populated poll after save");
        return res.status(500).json({ message: "Failed to retrieve updated poll" });
      }
  
      // Find the group and message for socket notification
      const message = await GroupMessage.findById(poll.messageId);
      const group = await Group.findById(poll.groupId);
  
      if (!message) {
        console.log("Associated message not found:", poll.messageId);
        return res.status(404).json({ message: "Associated message not found" });
      }
  
      if (!group) {
        console.log("Group not found:", poll.groupId);
        return res.status(404).json({ message: "Group not found" });
      }
  
      // Format the poll to ensure consistent data structure
      const formattedPoll = {
        ...populatedPoll.toObject(),
        options: populatedPoll.options.map(opt => ({
          ...opt.toObject(),
          votes: Array.isArray(opt.votes) ? opt.votes : []
        }))
      };
  
      // Log the formatted poll for verification
      console.log("Formatted poll:", {
        id: formattedPoll._id,
        options: formattedPoll.options.map(o => ({
          id: o._id,
          text: o.text,
          voteCount: o.votes.length
        }))
      });
  
      // Broadcast vote to all group members
      group.members.forEach((memberId) => {
        const socketId = getReceiverSocketId(memberId);
        if (socketId) {
          io.to(socketId).emit("pollVote", {
            poll: formattedPoll,
            voter: { _id: userId, optionId },
            groupId: group._id,
            messageId: message._id,
          });
        }
      });
  
      // Return the updated poll
      res.status(200).json(formattedPoll);
    } catch (error) {
      console.error("Error in votePoll controller:", error);
      res.status(500).json({ error: "Internal server error", details: error.message });
    }
  };
  
  /*****************************************************************************************
   *  END A POLL                                                                           *
   *****************************************************************************************/
  export const endPoll = async (req, res) => {
    try {
      const { pollId } = req.params;
      const userId = req.user._id;
  
      console.log(`User ${userId} attempting to end poll ${pollId}`);
  
      // Find the poll with populated creator
      const poll = await Poll.findById(pollId).populate("creator", "fullName profilePic");
      
      if (!poll) {
        console.log("Poll not found:", pollId);
        return res.status(404).json({ message: "Poll not found" });
      }
  
      // Convert to strings for safe comparison
      const pollCreatorId = poll.creator._id.toString();
      const requestUserId = userId.toString();
  
      console.log(`Poll creator ID: ${pollCreatorId}, Request user ID: ${requestUserId}`);
      
      // Check if the user is the creator of the poll
      if (pollCreatorId !== requestUserId) {
        console.log("Permission denied: User is not the poll creator");
        return res.status(403).json({ 
          message: "Only the poll creator can end it",
          details: {
            pollCreator: pollCreatorId,
            requestUser: requestUserId
          }
        });
      }
  
      // Update the poll
      poll.isActive = false;
      await poll.save();
      console.log("Poll ended successfully");
  
      // Get the fully populated poll for response
      const populatedPoll = await Poll.findById(pollId)
        .populate("creator", "fullName profilePic")
        .populate("options.votes", "fullName profilePic");
  
      // Notify group members
      const group = await Group.findById(poll.groupId);
      if (group && group.members) {
        group.members.forEach((memberId) => {
          const socketId = getReceiverSocketId(memberId);
          if (socketId) {
            io.to(socketId).emit("pollEnded", { 
              pollId: poll._id,
              messageId: poll.messageId,
              groupId: poll.groupId
            });
          }
        });
      }
  
      res.status(200).json(populatedPoll);
    } catch (error) {
      console.error("Error in endPoll controller:", error);
      res.status(500).json({ error: "Internal server error", details: error.message });
    }
  };

/*****************************************************************************************
 *  (OPTIONAL) GET POLL RESULTS WITHOUT VOTING                                           *
 *****************************************************************************************/
export const getPollResults = async (req, res) => {
  try {
    const { pollId } = req.params;
    const poll = await Poll.findById(pollId)
      .populate("creator", "fullName profilePic")
      .populate("options.votes", "fullName profilePic");

    if (!poll) return res.status(404).json({ message: "Poll not found" });
    res.status(200).json(poll);
  } catch (error) {
    console.error("Error in getPollResults controller:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
