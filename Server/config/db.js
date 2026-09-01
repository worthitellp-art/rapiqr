const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

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
    console.log('[DATABASE] Connected to primary MongoDB cluster successfully.');
    return mongoose.connection;
  } catch (err) {
    console.warn('[DATABASE] Primary MongoDB connection failed (likely IP whitelist or network issue):', err.message);
    console.log('[DATABASE] Attempting connection to local MongoDB fallback at:', localUri);
    try {
      connectionPromise = mongoose.connect(localUri, { serverSelectionTimeoutMS: 3000 });
      await connectionPromise;
      console.log('[DATABASE] Connected to local MongoDB fallback.');
      return mongoose.connection;
    } catch (localErr) {
      console.error('[DATABASE] Local MongoDB fallback failed:', localErr.message);
      console.error('[DATABASE] To fix: Whitelist IP 0.0.0.0/0 on MongoDB Atlas (https://cloud.mongodb.com/ -> Network Access) or start local mongod.');
      throw err;
    }
  }
}

module.exports = {
  connectDB,
  mongoose,
};
