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
export const votePoll = async (req, res) => {
    try {
      const { pollId, optionId } = req.body;
      const userId = req.user._id;
  
      console.log(`Processing vote: User ${userId} voting for option ${optionId} in poll ${pollId}`);
  
      const poll = await Poll.findById(pollId);
      if (!poll) return res.status(404).json({ message: "Poll not found" });
      if (!poll.isActive) return res.status(400).json({ message: "This poll is no longer active" });
  
      // 1️⃣ Remove any previous vote by this user
      poll.options.forEach((opt) => {
        opt.votes = opt.votes.filter((v) => v.toString() !== userId.toString());
      });
  
      // 2️⃣ Add the new vote
      const option = poll.options.id(optionId);
      if (!option) return res.status(404).json({ message: "Option not found" });
      option.votes.push(userId);
  
      // ✅ Mark the nested path as modified so Mongoose actually saves the change
      poll.markModified("options");
      await poll.save();
  
      // Grab associated message for socket payload
      const message = await GroupMessage.findById(poll.messageId);
      if (!message) return res.status(404).json({ message: "Associated message not found" });
  
      // Hydrate poll for response / socket
      const populatedPoll = await Poll.findById(poll._id)
        .populate("creator", "fullName profilePic")
        .populate("options.votes", "fullName profilePic");
  
      // Additional check to ensure we have valid data before sending
      if (!populatedPoll) {
        console.error("Failed to retrieve populated poll after save");
        return res.status(500).json({ message: "Failed to retrieve updated poll" });
      }
  
      // Log the populated poll for debugging
      console.log("Populated poll to return:", {
        id: populatedPoll._id,
        options: populatedPoll.options.map(o => ({
          id: o._id,
          text: o.text,
          voteCount: o.votes.length
        }))
      });
  
      const group = await Group.findById(poll.groupId);
      if (!group) return res.status(404).json({ message: "Group not found" });
  
      // Format the poll to ensure consistent data structure before sending
      const formattedPoll = {
        ...populatedPoll.toObject(),
        options: populatedPoll.options.map(opt => ({
          ...opt.toObject(),
          votes: Array.isArray(opt.votes) ? opt.votes : []
        }))
      };
  
      // Broadcast vote to all members
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
  
      res.status(200).json(formattedPoll);
    } catch (error) {
      console.error("Error in votePoll controller:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };
/*****************************************************************************************
 *  END A POLL                                                                           *
 *****************************************************************************************/
export const endPoll = async (req, res) => {
  try {
    const { pollId } = req.params;
    const userId = req.user._id;

    const poll = await Poll.findById(pollId);
    if (!poll) return res.status(404).json({ message: "Poll not found" });
    if (poll.creator.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Only the poll creator can end it" });
    }

    poll.isActive = false;
    await poll.save();

    // Notify members that the poll is closed
    const group = await Group.findById(poll.groupId);
    if (group) {
      group.members.forEach((memberId) => {
        const socketId = getReceiverSocketId(memberId);
        if (socketId) io.to(socketId).emit("pollEnded", { pollId: poll._id });
      });
    }

    res.status(200).json({ message: "Poll ended" });
  } catch (error) {
    console.error("Error in endPoll controller:", error);
    res.status(500).json({ error: "Internal server error" });
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
