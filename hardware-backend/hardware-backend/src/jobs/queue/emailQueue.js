import { Queue, Worker } from 'bullmq';
import redis from '../../config/redis.js';
import * as emailService from '../../services/emailService.js';
import logger from '../../utils/logger.js';

// Check if Redis is available before creating queue
let isRedisAvailable = false;

// Try to check Redis connection status
const checkRedis = async () => {
  try {
    if (redis.status === 'ready' || redis.status === 'connecting') {
      isRedisAvailable = true;
      return true;
    }
    // Try to ping Redis
    await redis.ping();
    isRedisAvailable = true;
    return true;
  } catch (err) {
    isRedisAvailable = false;
    return false;
  }
};

// Create queue only if Redis is available
export const emailQueue = new Queue('email', { 
  connection: redis,
  // Don't throw errors if connection fails
  skipVersionCheck: true 
});

const JOB_HANDLERS = {
  verification: ({ to, token }) => emailService.sendVerificationEmail(to, token),
  passwordReset: ({ to, token }) => emailService.sendPasswordResetEmail(to, token),
  creditReminder: ({ to, customerName, dueAmount }) => emailService.sendCreditReminderEmail(to, { customerName, dueAmount }),
  lowStockAlert: ({ to, products }) => emailService.sendLowStockAlertEmail(to, products),
};

export function startEmailWorker() {
  // Don't start worker if Redis isn't available
  if (redis.status !== 'ready' && redis.status !== 'connecting') {
    logger.info('[emailQueue] Redis not available - email worker not started');
    return null;
  }

  const worker = new Worker(
    'email',
    async (job) => {
      const handler = JOB_HANDLERS[job.name];
      if (!handler) throw new Error(`Unknown email job type: ${job.name}`);
      return handler(job.data);
    },
    { connection: redis }
  );

  worker.on('failed', (job, err) => {
    logger.error(`[emailQueue] job ${job?.id} (${job?.name}) failed: ${err.message}`);
  });

  return worker;
}

/** Convenience enqueue helpers — call these instead of emailService directly from controllers. */
export const enqueueVerificationEmail = async (to, token) => {
  try {
    if (redis.status === 'ready') {
      return await emailQueue.add('verification', { to, token });
    } else {
      // Fallback: send email directly
      logger.info(`[emailQueue] Redis unavailable - sending verification email directly to ${to}`);
      return await emailService.sendVerificationEmail(to, token);
    }
  } catch (err) {
    logger.error(`[emailQueue] Failed to send verification email: ${err.message}`);
    // Don't throw - email failure shouldn't break the request
  }
};

export const enqueuePasswordResetEmail = async (to, token) => {
  try {
    if (redis.status === 'ready') {
      return await emailQueue.add('passwordReset', { to, token });
    } else {
      logger.info(`[emailQueue] Redis unavailable - sending password reset email directly to ${to}`);
      return await emailService.sendPasswordResetEmail(to, token);
    }
  } catch (err) {
    logger.error(`[emailQueue] Failed to send password reset email: ${err.message}`);
  }
};