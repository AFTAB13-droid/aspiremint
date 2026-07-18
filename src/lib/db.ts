import mongoose from "mongoose";
import dns from "dns";

// Set DNS result order to ipv4first to avoid potential timeout issues with dual-stack resolution
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable inside .env.local");
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

async function connectToDatabase() {
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  // CRITICAL FIX: If the connection dropped but the promise is still cached, clear it so we can reconnect
  if (mongoose.connection.readyState !== 1) {
    cached.promise = null;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000, // Reduced to fail fast instead of hanging for 10s
      socketTimeoutMS: 45000,
      family: 4, // Force IPv4
      // Removed maxIdleTimeMS completely. In serverless/Next.js, aggressive idle disconnects cause major latency spikes on "cold" API routes.
    };

    cached.promise = mongoose.connect(MONGODB_URI as string, opts).then((mongoose) => {
      console.log("Connected to MongoDB successfully");
      return mongoose;
    });
  }
  
  try {
    cached.conn = await cached.promise;
  } catch (e) {
    console.error("MongoDB connection error:", e);
    cached.promise = null; // Reset promise so next call can retry
    throw e;
  }
  
  return cached.conn;
}

export default connectToDatabase;
