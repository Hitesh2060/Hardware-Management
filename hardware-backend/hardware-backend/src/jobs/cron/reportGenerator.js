import cron from 'node-cron';
import { getSalesReport, getProfitReport } from '../../services/reportService.js';
import { notifyAllAdmins } from '../../services/notificationService.js';
import { startOfDay, endOfDay, daysAgo } from '../../utils/dateHelpers.js';
import logger from '../../utils/logger.js';

/**
 * Generates yesterday's summary and pushes it as a notification. For an
 * actual emailed PDF digest, reuse reportController.js's pdfkit pattern here
 * instead of the JSON summary — kept simple to start.
 */
async function generateDailyDigest() {
  const yesterday = daysAgo(1);
  const from = startOfDay(yesterday);
  const to = endOfDay(yesterday);

  const [sales, profit] = await Promise.all([
    getSalesReport({ from, to, groupBy: 'day' }),
    getProfitReport({ from, to }),
  ]);

  const totalSales = sales.reduce((sum, s) => sum + s.totalSales, 0);

  await notifyAllAdmins({
    type: 'SYSTEM',
    title: `Daily digest — ${from.toDateString()}`,
    message: `Sales: ${totalSales.toFixed(2)} | Net profit: ${profit.netProfit.toFixed(2)}`,
    metadata: { sales, profit },
  });

  logger.info(`[reportGenerator] daily digest generated for ${from.toDateString()}`);
}

/** Runs every day at 7:00 AM server time (summarizing the previous day). */
export function scheduleReportGenerator() {
  cron.schedule('0 7 * * *', () => {
    generateDailyDigest().catch((err) => logger.error('[reportGenerator] failed', { error: err.message }));
  });
}

export { generateDailyDigest };
