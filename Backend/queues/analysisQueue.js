import { Queue } from 'bullmq';
import redisConnection from '../config/redis.js';



export const analysisQueue = new Queue('analysis-queue', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,                 // Retry up to 3 times on failure
    backoff: {
      type: 'exponential',
      delay: 5000,               // Start with 5s delay, then exponential
    },
    removeOnComplete: true,      // Clean up metadata when successful
    removeOnFail: false,         // Keep failed jobs for diagnostic logging
  }
});
