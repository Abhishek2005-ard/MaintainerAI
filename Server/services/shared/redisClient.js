import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

let isConnected = false;
let warningLogged = false;

// Create Redis client connection
export const redis = new Redis(redisUrl, {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  retryStrategy() {
    return 5000;
  },
});

redis.on('connect', () => {
  isConnected = true;
  warningLogged = false;
  console.log('[Redis] Connected to Redis server.');
});

redis.on('error', (err) => {
  isConnected = false;
  if (!warningLogged) {
    console.warn(`[Redis Warning] Could not connect to Redis (${err.message}). Caching will enable automatically when Redis starts.`);
    warningLogged = true;
  }
});

redis.on('close', () => {
  isConnected = false;
});

// Check if Redis connection is ready
export function isRedisConnected() {
  return isConnected && redis.status === 'ready';
}

// Get cached value by key
export async function getCache(key) {
  try {
    if (!isConnected) return null;
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  } catch (_err) {
    return null;
  }
}

// Save value to cache with TTL
export async function setCache(key, value, ttlSeconds = 300) {
  try {
    if (!isConnected) return false;
    const serialized = JSON.stringify(value);
    if (ttlSeconds > 0) {
      await redis.set(key, serialized, 'EX', ttlSeconds);
    } else {
      await redis.set(key, serialized);
    }
    return true;
  } catch (_err) {
    return false;
  }
}

// Remove cached keys
export async function delCache(...keys) {
  try {
    if (!isConnected || keys.length === 0) return 0;
    return await redis.del(...keys);
  } catch (_err) {
    return 0;
  }
}

// Delete cached keys matching a pattern
export async function clearPattern(pattern) {
  try {
    if (!isConnected) return 0;
    const stream = redis.scanStream({ match: pattern });
    let deletedCount = 0;

    for await (const keys of stream) {
      if (keys.length) {
        await redis.del(...keys);
        deletedCount += keys.length;
      }
    }
    return deletedCount;
  } catch (_err) {
    return 0;
  }
}
