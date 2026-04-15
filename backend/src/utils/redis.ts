import Redis from 'ioredis';

const IS_PRODUCTION = process.env['NODE_ENV'] === 'production';
const REDIS_URL = process.env['REDIS_URL'];

// In production, REDIS_URL must be set (Railway provides this automatically)
if (IS_PRODUCTION && !REDIS_URL) {
  throw new Error('REDIS_URL environment variable is required in production');
}

// Fallback to localhost only in development
const redisConnectionUrl = REDIS_URL ?? 'redis://localhost:6379';

const redisOptions = {
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  enableReadyCheck: true,
  retryDelayOnFailover: 100,
  retryDelayOnClusterDown: 100,
};

// Main Redis client for general operations
export const redis = new Redis(redisConnectionUrl, redisOptions);

// Separate client for publishing
export const redisPub = new Redis(redisConnectionUrl, redisOptions);

// Separate client for subscribing
export const redisSub = new Redis(redisConnectionUrl, redisOptions);

// Log connection status
redis.on('connect', () => console.log('Redis connected'));
redis.on('error', (err) => console.error('Redis error:', err.message));

// Cache helpers
const CACHE_TTL = 60; // 60 seconds default TTL

export async function getCached<T>(key: string): Promise<T | null> {
  const data = await redis.get(key);
  if (!data) return null;
  return JSON.parse(data) as T;
}

export async function setCache<T>(key: string, data: T, ttl = CACHE_TTL): Promise<void> {
  await redis.setex(key, ttl, JSON.stringify(data));
}

export async function invalidateCache(pattern: string): Promise<void> {
  const keys = await redis.keys(pattern);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
}

// Pub/Sub helpers
export async function publishEvent(channel: string, data: unknown): Promise<void> {
  await redisPub.publish(channel, JSON.stringify(data));
}

export function getPlanChannel(planCode: string): string {
  return `plan:${planCode}`;
}
