import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import connectToDatabase from "@/lib/db";
import redis from "@/lib/redis";

/**
 * System Warmup Ping Endpoint
 * Called every 10 minutes by Vercel Cron or uptime monitors.
 * Keeps Node container, Next.js API route bundles, MongoDB connection pool, and Redis connection warm.
 * Prevents 1.5s–2.5s cold start delays on login and registration.
 */
export async function GET() {
  const startTime = Date.now();
  let dbStatus = "connected";
  let redisStatus = "connected";

  // 1. Warm up MongoDB connection pool
  try {
    await connectToDatabase();
  } catch (dbErr: any) {
    dbStatus = `error: ${dbErr.message || "failed"}`;
    console.error("[Warmup Ping] MongoDB connection error:", dbErr);
  }

  // 2. Warm up Redis connection (non-blocking with 500ms timeout)
  try {
    await Promise.race([
      redis.ping(),
      new Promise((_, reject) => setTimeout(() => reject(new Error("Redis Ping Timeout")), 500))
    ]);
  } catch (redisErr: any) {
    redisStatus = `error/bypass: ${redisErr.message || "failed"}`;
  }

  // 3. Automated 20-Day Refund Reminders check (background, non-blocking)
  try {
    const { checkAndSendRefundReminders } = await import("@/services/refundReminderService");
    checkAndSendRefundReminders().catch((err) => console.error("[Warmup Ping] Refund reminder check error:", err));
  } catch (reminderErr) {
    console.warn("[Warmup Ping] Failed to trigger refund reminder check:", reminderErr);
  }

  const durationMs = Date.now() - startTime;

  return NextResponse.json({
    success: true,
    message: "System keep-alive synchronization successful",
    status: "warm",
    services: {
      mongodb: dbStatus,
      redis: redisStatus,
    },
    latencyMs: durationMs,
    timestamp: new Date().toISOString(),
  });
}
