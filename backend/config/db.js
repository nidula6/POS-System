// backend/config/db.js

const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    // fallback to a local MongoDB URI if MONGO_URI is not provided
    const mongoUri = process.env.MONGO_URI;
    const conn = await mongoose.connect(mongoUri);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
