import IORedis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const redisConnection = process.env.REDIS_URL
  ? new IORedis(process.env.REDIS_URL, { maxRetriesPerRequest: null })
  : new IORedis({
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      maxRetriesPerRequest: null,
    });

redisConnection.on('connect', () => {
  console.log('[Redis] Secure connection to Upstash/local Redis cluster established.');
});

redisConnection.on('error', (err) => {
  console.error('[Redis Error] Failed to connect or maintain connection:', err.message);
});

export default redisConnection;
