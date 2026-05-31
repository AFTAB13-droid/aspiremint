import { Redis } from '@upstash/redis';

// Guarantee that redis is NEVER null to satisfy other endpoints in the app.
// If environment variables are missing, we fall back to dummy credentials.
// Being a REST client, Upstash Redis will not attempt active socket connections upon instantiation.
const redisUrl = process.env.UPSTASH_REDIS_REST_URL || 'https://well-impala-70434.upstash.io';
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || 'dummy_token';

export const redis = new Redis({
  url: redisUrl,
  token: redisToken,
});

export default redis;

/**
 * Key Constants
 */
export const CACHE_KEYS = {
  ACTIVE_DEALS: 'active_deals_list',
  USER_STATS_PREFIX: 'user_stats_:',
  ADMIN_STATS: 'admin_dashboard_stats',
  ADMIN_EARNINGS_PREFIX: 'admin_earnings_:',
};

/**
 * Resilient Cache GET Wrapper with absolute 400ms timeout.
 * If Redis is down, slow, or free tier is exceeded, this gracefully returns null
 * so the system fetches directly from MongoDB without crashing or throwing 500s.
 */
export async function getCache<T>(key: string): Promise<T | null> {
  try {
    const fetchPromise = redis.get<T>(key);
    
    const timeoutPromise = new Promise<null>((_, reject) =>
      setTimeout(() => reject(new Error('Redis Cache Timeout')), 1500)
    );

    // Race the Redis request against the 400ms timeout
    const result = await Promise.race([fetchPromise, timeoutPromise]);
    return result as T | null;
  } catch (error: any) {
    console.warn(`[Redis Cache Bypass] Key: "${key}" | Reason: ${error.message || error}`);
    return null;
  }
}

/**
 * Resilient Cache SET Wrapper.
 * Non-blocking fire-and-forget write. If Redis fails/is over quota, it fails silently
 * to keep the user operation fast and functional.
 */
export async function setCache(key: string, value: any, ttlSeconds?: number): Promise<void> {
  try {
    const opts = ttlSeconds ? { ex: ttlSeconds } : undefined;
    
    // Perform set operation
    redis.set(key, JSON.stringify(value), opts).catch(err => {
      console.warn(`[Redis Cache Set Error] Key: "${key}" | Reason:`, err.message || err);
    });
  } catch (error: any) {
    console.warn(`[Redis Cache Set Sync Error] Key: "${key}" | Reason:`, error.message || error);
  }
}

/**
 * Resilient Cache DELETE Wrapper.
 */
export async function invalidateCache(key: string): Promise<void> {
  try {
    await redis.del(key);
  } catch (error: any) {
    console.warn(`[Redis Cache Invalidation Sync Error] Key: "${key}" | Reason:`, error.message || error);
  }
}

/**
 * Dedicated helper to invalidate active deals listing cache
 */
export async function invalidateDealsCache() {
  await invalidateCache(CACHE_KEYS.ACTIVE_DEALS);
  console.log('Redis Invalidation Triggered: Active Deals');
}
