const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const { logger } = require('../middleware/loggerMiddleware');

dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  // No silent fallback: refusing to start with no database configured, same
  // "fail loud" posture the old Supabase config used for a missing service key.
  throw new Error('MONGODB_URI is not set in Server/.env — refusing to start with no database configured.');
}

mongoose.set('strictQuery', true);

let connectionPromise = null;

async function connectDB() {
  if (connectionPromise) return connectionPromise;

  const primaryUri = MONGODB_URI;
  const localUri = process.env.MONGODB_LOCAL_URI || 'mongodb://127.0.0.1:27017/repiqr';

  try {
    connectionPromise = mongoose.connect(primaryUri, { serverSelectionTimeoutMS: 5000 });
    await connectionPromise;
    logger.db('DB_CONNECT', 'Connected to primary MongoDB cluster successfully.', { target: 'primary' });
    return mongoose.connection;
  } catch (err) {
    logger.warn('DB_CONNECT_FAILOVER', 'Primary MongoDB connection failed, attempting local fallback', { error: err.message, localUri });
    try {
      connectionPromise = mongoose.connect(localUri, { serverSelectionTimeoutMS: 3000 });
      await connectionPromise;
      logger.db('DB_CONNECT', 'Connected to local MongoDB fallback.', { target: 'local_fallback' });
      return mongoose.connection;
    } catch (localErr) {
      logger.fatal(
        'DB_CONNECT_FAILED',
        'Both primary and local MongoDB connections failed — server cannot start. ' +
          'Fix: whitelist IP 0.0.0.0/0 on MongoDB Atlas (Network Access) or start local mongod.',
        localErr
      );
      throw err;
    }
  }
}

module.exports = {
  connectDB,
  mongoose,
};
