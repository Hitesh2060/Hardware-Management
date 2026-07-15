import cron from 'node-cron';
import { getOverdueCustomers } from '../../services/creditService.js';
import { sendCreditReminderEmail } from '../../services/emailService.js';
import { notifyUser } from '../../services/notificationService.js';
import logger from '../../utils/logger.js';

async function sendCreditReminders() {
  const overdueSales = await getOverdueCustomers(30);
  const byCustomer = new Map();

  for (const sale of overdueSales) {
    if (!sale.customer?.email) continue;
    const existing = byCustomer.get(sale.customerId) || { customer: sale.customer, dueAmount: 0 };
    existing.dueAmount += Number(sale.dueAmount);
    byCustomer.set(sale.customerId, existing);
  }

  for (const { customer, dueAmount } of byCustomer.values()) {
    await sendCreditReminderEmail(customer.email, { customerName: customer.name, dueAmount: dueAmount.toFixed(2) });
    logger.info(`[creditReminder] sent to ${customer.email} (due: ${dueAmount.toFixed(2)})`);
  }
}

/** Runs every day at 9:00 AM server time. Registered from server.js. */
export function scheduleCreditReminder() {
  cron.schedule('0 9 * * *', () => {
    sendCreditReminders().catch((err) => logger.error('[creditReminder] failed', { error: err.message }));
  });
}

export { sendCreditReminders };
