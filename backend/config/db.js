const mongoose = require('mongoose');

// Global cache across serverless warm invocations
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false, // Prevents queries from hanging when socket isn't ready
      serverSelectionTimeoutMS: 5000, // Fail fast rather than hanging indefinitely
    };

    cached.promise = mongoose.connect(process.env.MONGO_URI, opts).then((mongooseInstance) => {
      console.log(`MongoDB Connected: ${mongooseInstance.connection.host}`);
      return mongooseInstance;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    console.error(`MongoDB Connection Error: ${error.message}`);
    // NEVER call process.exit(1) in a serverless environment!
    throw error; 
  }

  return cached.conn;
};

module.exports = connectDB;