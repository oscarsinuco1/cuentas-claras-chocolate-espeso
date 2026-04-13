import Redis from 'ioredis';

const REDIS_URL = process.env['REDIS_URL'] ?? 'redis://localhost:6379';

// Main Redis client for general operations
export const redis = new Redis(REDIS_URL, {
  maxRetriesPerRequest: 3,
  lazyConnect: true,
});

// Separate client for publishing
export const redisPub = new Redis(REDIS_URL, {
  maxRetriesPerRequest: 3,
  lazyConnect: true,
});

// Separate client for subscribing
export const redisSub = new Redis(REDIS_URL, {
  maxRetriesPerRequest: 3,
  lazyConnect: true,
});

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
