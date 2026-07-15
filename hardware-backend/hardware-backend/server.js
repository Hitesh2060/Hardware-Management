import app from './src/app.js';
import { env } from './src/config/env.js';
import prisma, { connectDatabase } from './src/config/database.js';
import { connectRedis, isRedisReady } from './src/config/redis.js';
import { verifyMailConnection } from './src/config/email.js';
import logger from './src/utils/logger.js';

import { scheduleLowStockAlert } from './src/jobs/cron/lowStockAlert.js';
import { scheduleCreditReminder } from './src/jobs/cron/creditReminder.js';
import { scheduleReportGenerator } from './src/jobs/cron/reportGenerator.js';

async function bootstrap() {
  // Connect to Database
  const dbConnected = await connectDatabase();
  
  // Connect to Redis (optional)
  const redisConnected = await connectRedis();
  
  // Verify Email (optional)
  await verifyMailConnection();

  // Cron jobs - these run regardless of Redis
  scheduleLowStockAlert();
  scheduleCreditReminder();
  scheduleReportGenerator();

  // Only start queue workers if Redis is available
  if (redisConnected) {
    try {
      const { startEmailWorker } = await import('./src/jobs/queue/emailQueue.js');
      const { startNotificationWorker } = await import('./src/jobs/queue/notificationQueue.js');
      startEmailWorker();
      startNotificationWorker();
      logger.info('✅ Queue workers started');
    } catch (err) {
      logger.warn(`Queue workers not started: ${err.message}`);
    }
  } else {
    logger.info('ℹ️  Queue workers skipped (Redis not available)');
  }

  const server = app.listen(env.port, () => {
    console.log(`🚀 Server running on port ${env.port} [${env.nodeEnv}]`);
    logger.info(`🚀 Hardware IMS API running on port ${env.port} [${env.nodeEnv}]`);
  });

  async function shutdown(signal) {
    logger.info(`${signal} received. Shutting down gracefully...`);
    server.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
  }

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('unhandledRejection', (reason) => logger.error('Unhandled Rejection', { reason }));
}

bootstrap();