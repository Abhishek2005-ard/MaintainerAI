import { Queue, Worker } from 'bullmq';
import { runTriage } from '../services/TriageService.js';
import { logger } from '../utils/logger.js';

const connection = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null,
  enableOfflineQueue: false,
  retryStrategy: () => 5000,
};

export const TRIAGE_QUEUE_NAME = 'triage-queue';

export const triageQueue = new Queue(TRIAGE_QUEUE_NAME, {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: { age: 3600, count: 1000 },
    removeOnFail: { age: 86400, count: 5000 },
  },
});

triageQueue.on('error', (err) => {
  // Silent error handler for queue connection drops
});

export const triageWorker = new Worker(
  TRIAGE_QUEUE_NAME,
  async (job) => {
    logger.info(`[TriageWorker] Processing job #${job.id} for issue #${job.data.issue?.number}`);
    const { issue, triageRules } = job.data;
    const result = await runTriage(issue, triageRules ?? null);
    return result;
  },
  { connection, concurrency: 5 }
);

triageWorker.on('completed', (job, returnvalue) => {
  logger.info(`[TriageWorker] Job #${job.id} completed successfully.`);
});

triageWorker.on('failed', (job, err) => {
  logger.error(`[TriageWorker] Job #${job?.id} failed with error: ${err.message}`);
});

let workerWarned = false;
triageWorker.on('error', (err) => {
  if (!workerWarned) {
    logger.warn(`[TriageWorker Warning] Redis connection offline (${err.message}). Background queue processing is paused until Redis starts.`);
    workerWarned = true;
  }
});
