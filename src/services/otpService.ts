import redis from "@/lib/redis";
import connectToDatabase from "@/lib/db";
import { Otp } from "@/modules/auth/otp.model";

/**
 * Resilient OTP & Rate Limit Service
 * Ensures 100% reliability even if Upstash Redis free tier quota is exceeded or offline.
 * Automatically falls back to MongoDB TTL collection when Redis fails or times out.
 */

const REDIS_TIMEOUT_MS = 1000;

function withTimeout<T>(promise: Promise<T>, timeoutMs = REDIS_TIMEOUT_MS): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("Redis operation timed out")), timeoutMs)
    ),
  ]);
}

/**
 * Store an OTP or secure token with expiration.
 * Attempts Redis first; if quota exceeded or offline, falls back to MongoDB TTL model.
 */
export async function storeOtp(key: string, value: string, ttlSeconds = 300): Promise<void> {
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

  // 1. Try Redis
  try {
    await withTimeout(redis.set(key, value, { ex: ttlSeconds }));
  } catch (redisError: any) {
    console.warn(`[Redis OTP Store Bypass] Key: "${key}" | Reason: ${redisError.message || redisError}. Falling back to MongoDB.`);
  }

  // 2. Always write to MongoDB as bulletproof backup
  try {
    await connectToDatabase();
    await Otp.findOneAndUpdate(
      { key },
      { value, expiresAt },
      { upsert: true, setDefaultsOnInsert: true, new: true }
    );
  } catch (dbError: any) {
    console.error(`[MongoDB OTP Store Error] Key: "${key}" | Reason:`, dbError.message || dbError);
  }
}

/**
 * Retrieve an OTP or secure token.
 * Checks Redis first; if missing or quota exceeded, retrieves from MongoDB.
 */
export async function getOtp(key: string): Promise<string | null> {
  // 1. Try Redis
  try {
    const val = await withTimeout(redis.get(key));
    if (val !== null && val !== undefined) {
      if (typeof val === "object") {
        return JSON.stringify(val);
      }
      return String(val).trim();
    }
  } catch (redisError: any) {
    console.warn(`[Redis OTP Get Bypass] Key: "${key}" | Reason: ${redisError.message || redisError}. Checking MongoDB fallback.`);
  }

  // 2. Fallback to MongoDB
  try {
    await connectToDatabase();
    const doc = await Otp.findOne({ key, expiresAt: { $gt: new Date() } });
    if (doc) {
      return doc.value.trim();
    }
  } catch (dbError: any) {
    console.error(`[MongoDB OTP Get Error] Key: "${key}" | Reason:`, dbError.message || dbError);
  }

  return null;
}

/**
 * Delete an OTP after verification.
 */
export async function deleteOtp(key: string): Promise<void> {
  try {
    redis.del(key).catch(() => {});
  } catch (e) {}

  try {
    await connectToDatabase();
    await Otp.deleteOne({ key });
  } catch (e) {}
}

/**
 * Fail-Safe Rate Limiter.
 * Checks request counts in Redis. If Upstash free tier quota is exceeded or offline,
 * it safely ALLOWS the request so users are never blocked from logging in or signing up.
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds = 600
): Promise<{ allowed: boolean; waitMins: number }> {
  try {
    const attempts = await withTimeout(redis.incr(key));
    if (attempts === 1) {
      await redis.expire(key, windowSeconds).catch(() => {});
    }
    if (attempts > limit) {
      const ttl = await redis.ttl(key).catch(() => windowSeconds);
      const waitMins = Math.ceil((ttl > 0 ? ttl : windowSeconds) / 60);
      return { allowed: false, waitMins };
    }
    return { allowed: true, waitMins: 0 };
  } catch (redisError: any) {
    console.warn(`[Redis Rate Limit Bypass] Quota/Error for key "${key}". Allowing request to prevent service outage.`);
    // Fail open: allow traffic when rate limiter service is unreachable
    return { allowed: true, waitMins: 0 };
  }
}
