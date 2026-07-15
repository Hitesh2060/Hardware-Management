import { Queue, Worker } from 'bullmq';
import redis from '../../config/redis.js';
import * as notificationService from '../../services/notificationService.js';
import logger from '../../utils/logger.js';

/**
 * Used for notification fan-out that could otherwise be slow (e.g.
 * broadcasting to every ADMIN when there are many). Sale/purchase creation
 * flows should enqueue here rather than calling notificationService
 * directly and waiting, keeping the checkout/POS request fast.
 */
export const notificationQueue = new Queue('notification', { 
  connection: redis,
  skipVersionCheck: true
});

const JOB_HANDLERS = {
  notifyUser: (data) => notificationService.notifyUser(data),
  notifyAllAdmins: (data) => notificationService.notifyAllAdmins(data),
};

export function startNotificationWorker() {
  // Don't start worker if Redis isn't available
  if (redis.status !== 'ready' && redis.status !== 'connecting') {
    logger.info('[notificationQueue] Redis not available - notification worker not started');
    return null;
  }

  const worker = new Worker(
    'notification',
    async (job) => {
      const handler = JOB_HANDLERS[job.name];
      if (!handler) throw new Error(`Unknown notification job type: ${job.name}`);
      return handler(job.data);
    },
    { connection: redis }
  );

  worker.on('failed', (job, err) => {
    logger.error(`[notificationQueue] job ${job?.id} (${job?.name}) failed: ${err.message}`);
  });

  return worker;
}

export const enqueueUserNotification = async (data) => {
  try {
    if (redis.status === 'ready') {
      return await notificationQueue.add('notifyUser', data);
    } else {
      // Fallback: send notification directly
      logger.info('[notificationQueue] Redis unavailable - sending notification directly');
      return await notificationService.notifyUser(data);
    }
  } catch (err) {
    logger.error(`[notificationQueue] Failed to send notification: ${err.message}`);
  }
};

export const enqueueAdminBroadcast = async (data) => {
  try {
    if (redis.status === 'ready') {
      return await notificationQueue.add('notifyAllAdmins', data);
    } else {
      logger.info('[notificationQueue] Redis unavailable - broadcasting notification directly');
      return await notificationService.notifyAllAdmins(data);
    }
  } catch (err) {
    logger.error(`[notificationQueue] Failed to broadcast notification: ${err.message}`);
  }
};