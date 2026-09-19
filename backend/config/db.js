const mongoose = require('mongoose');
const logger = require('./logger');

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  // Reset cache if connection was dropped or disconnected
  if (cached.conn && mongoose.connection.readyState !== 1) {
    cached.conn = null;
    cached.promise = null;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 8000, // 8-second selection window for serverless cold starts
    };

    cached.promise = mongoose.connect(process.env.MONGO_URI, opts).then((mongooseInstance) => {
      logger.info({ host: mongooseInstance.connection.host }, 'MongoDB Connected');
      return mongooseInstance;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    logger.error({ err: error.message }, 'MongoDB Connection Error');
    // DO NOT CALL process.exit(1) HERE!
    throw error; 
  }

  return cached.conn;
};

module.exports = connectDB;