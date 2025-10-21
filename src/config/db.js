const mongoose = require('mongoose');

const { MONGODB_URI, MONGODB_DB } = process.env;
if (!MONGODB_URI) throw new Error('Missing MONGODB_URI');

mongoose.set('strictQuery', false);
mongoose.set('bufferCommands', false);

let cached = global.mongoose;
if (!cached) cached = (global.mongoose = { conn: null, promise: null });

async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI, {
        dbName: MONGODB_DB || undefined,
        serverSelectionTimeoutMS: 5000,
        maxPoolSize: 10,
      })
      .then((m) => m.connection);
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

module.exports = connectDB;
