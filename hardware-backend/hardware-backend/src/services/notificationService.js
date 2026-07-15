import prisma from '../config/database.js';

/** Creates a notification for a specific user (e.g. "your credit sale was approved"). */
export async function notifyUser({ userId, type, title, message, metadata }) {
  return prisma.notification.create({ data: { userId, type, title, message, metadata } });
}

/**
 * Broadcasts to every ADMIN (userId: null convention isn't queryable per-user,
 * so we fan out one row per admin instead — keeps "mark as read" per-person).
 * Used by jobs/cron/lowStockAlert.js and reportGenerator.js.
 */
export async function notifyAllAdmins({ type, title, message, metadata }) {
  const admins = await prisma.user.findMany({ where: { role: { name: 'ADMIN' }, isActive: true } });
  return prisma.notification.createMany({
    data: admins.map((admin) => ({ userId: admin.id, type, title, message, metadata })),
  });
}

export async function listMyNotifications(userId, { unreadOnly = false } = {}) {
  return prisma.notification.findMany({
    where: { userId, ...(unreadOnly ? { isRead: false } : {}) },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
}

export async function markAsRead(id, userId) {
  return prisma.notification.updateMany({ where: { id, userId }, data: { isRead: true } });
}

export async function markAllAsRead(userId) {
  return prisma.notification.updateMany({ where: { userId, isRead: false }, data: { isRead: true } });
}
