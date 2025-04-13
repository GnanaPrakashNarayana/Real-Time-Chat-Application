import { connectDB } from "./lib/db.js";
import mongoose from "mongoose";
import User from "./models/user.model.js";

const testConnection = async () => {
  try {
    // Try to connect
    const isConnected = await connectDB();
    
    if (!isConnected) {
      console.log("Failed to connect to database");
      return;
    }
    
    // Check connection state
    console.log("Connection state:", mongoose.connection.readyState);
    // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
    
    // Count users in the database
    const userCount = await User.countDocuments();
    console.log(`Total users in database: ${userCount}`);
    
    // List all users (optional, to see if your friend's account exists)
    const users = await User.find().select("email fullName");
    console.log("Users in database:");
    users.forEach(user => {
      console.log(`- ${user.fullName} (${user.email})`);
    });
    
  } catch (error) {
    console.error("Error during test:", error);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log("Connection closed");
  }
};

testConnection();