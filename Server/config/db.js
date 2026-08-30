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
  connectionPromise = mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
  await connectionPromise;
  return mongoose.connection;
}

module.exports = {
  connectDB,
  mongoose,
};
