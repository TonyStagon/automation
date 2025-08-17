import { Redis, RedisOptions } from 'ioredis';
import { logger } from '../../utils/logger';

const redisConfig: string | RedisOptions = process.env.REDIS_URL 
    ? process.env.REDIS_URL 
    : {
        host: 'localhost',
        port: 6379
      };

const redisOptions: RedisOptions = {
    retryStrategy: (times) => Math.min(times * 50, 2000),
    enableReadyCheck: false,
    maxRetriesPerRequest: 1,
    lazyConnect: true
};

// Using string URL or options object based on redisConfig
const redisClient = redisConfig instanceof Object
    ? new Redis(redisConfig, redisOptions)
    : new Redis(redisConfig, redisOptions);

redisClient.on('connect', () => logger.info('Redis connected'));
redisClient.on('error', (error) => logger.error('Redis error:', error));
redisClient.on('close', () => logger.warn('Redis closed'));

export default redisClient;
export const redis = redisClient;