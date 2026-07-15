import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

let isRedisAvailable = false;

export const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
  lazyConnect: true,
  retryStrategy: (times) => {
    if (times > 2) {
      return null; // stop retrying after 2 attempts
    }
    return Math.min(times * 200, 2000);
  },
});

redis.on('error', (err) => {
  if (!redis._errorLogged) {
    console.warn('⚠️  Redis not available — queues/caching disabled');
    redis._errorLogged = true;
    isRedisAvailable = false;
  }
});

redis.on('ready', () => {
  isRedisAvailable = true;
  console.log('✅ Redis connected');
});

export async function connectRedis() {
  try {
    await redis.connect();
    isRedisAvailable = true;
    console.log('✅ Redis connected');
    return true;
  } catch (err) {
    isRedisAvailable = false;
    console.warn('⚠️  Redis not available — continuing without queues/caching');
    return false;
  }
}

export function isRedisReady() {
  return isRedisAvailable && redis.status === 'ready';
}

export default redis;