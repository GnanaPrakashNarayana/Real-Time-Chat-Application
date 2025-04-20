// backend/src/models/user.model.js
import mongoose from "mongoose";

const bookmarkSchema = new mongoose.Schema({
  messageId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'messageType',
    required: true,
  },
  messageType: {
    type: String,
    required: true,
    enum: ['Message', 'GroupMessage']
  },
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'conversationType',
    required: true,
  },
  conversationType: {
    type: String,
    required: true,
    enum: ['User', 'Group']
  },
  name: {
    type: String,
    default: '',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    fullName: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    profilePic: {
      type: String,
      default: "",
    },
    bookmarks: [bookmarkSchema],
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;