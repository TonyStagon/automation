import { Redis, RedisOptions } from 'ioredis';
import { logger } from '../utils/logger';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

const redisOptions: RedisOptions = {
  retryStrategy: (times) => Math.min(times * 50, 2000),
  enableReadyCheck: false,
  maxRetriesPerRequest: 1,
  lazyConnect: true
};

export const redis = new Redis(redisUrl, redisOptions);

redis.on('connect', () => logger.info('Redis connected'));
redis.on('error', (error) => logger.error('Redis error:', error));
redis.on('close', () => logger.warn('Redis disconnected'));

export default redis;