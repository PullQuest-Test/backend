// src/utils/db.ts
import mongoose, { ConnectOptions, Connection } from "mongoose";
import dotenv from "dotenv";

dotenv.config();

let cachedConn: Connection | null = null;
const uri = process.env.MONGO_URI;

if (!uri) {
  throw new Error("❌  MONGO_URI is missing in environment variables");
}

const opts: ConnectOptions = {
  // these are defaults in Mongoose 7, but explicit here for clarity
  autoIndex: true,               // build indexes defined in schemas
  maxPoolSize: 10,               // maintain up to 10 socket connections
  serverSelectionTimeoutMS: 30_000,
  socketTimeoutMS: 45_000
};

/**
 * Connect to MongoDB (singleton). Resolves with an
 * open `mongoose.Connection`.
 */
export async function connectDB(): Promise<Connection> {
  if (cachedConn) return cachedConn;          // ⚡ already connected

  try {
    const conn = await mongoose.connect(uri, opts);
    cachedConn = conn.connection;

    console.log(`✅ MongoDB connected: ${cachedConn.host}`);

    // Optional: log disconnections & errors once per process
    cachedConn.on("disconnected", () => {
      console.warn("⚠️  MongoDB disconnected");
      cachedConn = null;
    });

    cachedConn.on("error", err => {
      console.error("❌ MongoDB connection error:", err);
    });

    return cachedConn;
  } catch (err) {
    console.error("❌ Initial MongoDB connection failed:", err);
    throw err;                                  // let caller decide
  }
}
