import cron from 'node-cron';
import prisma from '../../config/database.js';
import { getCurrentStock } from '../../services/stockService.js';
import { notifyAllAdmins } from '../../services/notificationService.js';
import { sendLowStockAlertEmail } from '../../services/emailService.js';
import logger from '../../utils/logger.js';

async function checkLowStock() {
  const products = await prisma.product.findMany({ where: { isActive: true } });
  const lowStock = [];

  for (const p of products) {
    const stock = await getCurrentStock(prisma, p.id);
    if (Number(stock) <= p.reorderLevel) lowStock.push({ ...p, currentStock: stock });
  }

  if (lowStock.length === 0) return;

  logger.info(`[lowStockAlert] ${lowStock.length} product(s) at/below reorder level`);

  await notifyAllAdmins({
    type: 'LOW_STOCK',
    title: 'Low stock alert',
    message: `${lowStock.length} product(s) are at or below their reorder level.`,
    metadata: { productIds: lowStock.map((p) => p.id) },
  });

  const admins = await prisma.user.findMany({ where: { role: { name: 'ADMIN' }, isActive: true } });
  for (const admin of admins) {
    await sendLowStockAlertEmail(admin.email, lowStock);
  }
}

/** Runs every day at 8:00 AM server time. Registered from server.js. */
export function scheduleLowStockAlert() {
  cron.schedule('0 8 * * *', () => {
    checkLowStock().catch((err) => logger.error('[lowStockAlert] failed', { error: err.message }));
  });
}

// Exported for manual triggering / testing without waiting for the cron tick.
export { checkLowStock };
