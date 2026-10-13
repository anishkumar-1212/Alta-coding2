const mongoose = require("mongoose");

let mongoServer;

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 2000 });
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.log("Local MongoDB unreachable. Starting In-Memory MongoDB fallback...");
    try {
      if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
      }
      const { MongoMemoryServer } = require("mongodb-memory-server");
      mongoServer = await MongoMemoryServer.create();
      const uri = mongoServer.getUri();
      await mongoose.connect(uri);
      console.log("In-Memory MongoDB connected successfully at:", uri);
    } catch (fallbackError) {
      console.error("MongoDB connection failed completely:", fallbackError.message);
      process.exit(1);
    }
  }
};

module.exports = connectDB;
