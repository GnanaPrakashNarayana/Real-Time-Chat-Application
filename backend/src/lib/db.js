import mongoose from "mongoose";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

export const connectDB = async () => {
  try {
    console.log("Attempting to connect to MongoDB...");
    console.log("MongoDB URI:", process.env.MONGO_URI.substring(0, 20) + "..."); // Only show part of the URI for security
    
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB connected: ${conn.connection.host}`);
    console.log(`Database name: ${conn.connection.name}`);
    return true;
  } catch (error) {
    console.log("MongoDB connection error:", error);
    return false;
  }
};