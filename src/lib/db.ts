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

  // If disconnected (0) or disconnecting (3), clear cached promise to force a clean reconnection.
  // Do NOT clear if readyState === 2 (currently connecting!), otherwise concurrent requests create a connection storm!
  if (mongoose.connection.readyState === 0 || mongoose.connection.readyState === 3) {
    cached.promise = null;
    cached.conn = null;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: true, // Enable query buffering so requests wait cleanly during wake-up/reconnect instead of throwing fatal errors
      serverSelectionTimeoutMS: 5000, // Reduced to fail fast instead of hanging for 10s
      socketTimeoutMS: 45000,
      family: 4, // Force IPv4
      maxPoolSize: 1, // Crucial for Serverless: limits each lambda to 1 connection to avoid crushing the MongoDB Free Tier limit
      minPoolSize: 0,
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
