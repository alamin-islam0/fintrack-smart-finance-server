const mongoose = require("mongoose");

let cachedConnection = null;
let connectionPromise = null;

async function connectDB() {
  if (cachedConnection && mongoose.connection.readyState === 1) {
    return cachedConnection;
  }

  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error("MONGO_URI is missing");

  try {
    if (!connectionPromise) {
      connectionPromise = mongoose.connect(uri, {
        retryWrites: true,
        w: "majority",
        serverSelectionTimeoutMS: 5000,
      });
    }

    cachedConnection = await connectionPromise;
    console.log("MongoDB connected successfully");
    return cachedConnection;
  } catch (error) {
    connectionPromise = null;
    console.error("MongoDB connection error:", error.message);
    throw error;
  }
}

module.exports = connectDB;
