import prisma from '../config/database.js';

/**
 * Staff performance is derived entirely from existing data (Sale.createdBy,
 * Purchase.createdBy) — no separate tracking table needed. Ranks cashiers by
 * revenue generated and invoice count over a date range.
 */
export async function getSalesStaffPerformance({ from, to }) {
  const grouped = await prisma.sale.groupBy({
    by: ['createdById'],
    where: { saleDate: { gte: from, lte: to }, status: 'COMPLETED' },
    _sum: { totalAmount: true },
    _count: { id: true },
    orderBy: { _sum: { totalAmount: 'desc' } },
  });

  const userIds = grouped.map((g) => g.createdById);
  const users = await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true } });
  const userMap = Object.fromEntries(users.map((u) => [u.id, u.name]));

  return grouped.map((g) => ({
    staffId: g.createdById,
    staffName: userMap[g.createdById] || 'Unknown',
    totalSalesAmount: g._sum.totalAmount,
    invoiceCount: g._count.id,
    averageSaleValue: Number(g._sum.totalAmount) / g._count.id,
  }));
}

export async function getPurchaseStaffPerformance({ from, to }) {
  const grouped = await prisma.purchase.groupBy({
    by: ['createdById'],
    where: { purchaseDate: { gte: from, lte: to }, status: 'RECEIVED' },
    _sum: { totalAmount: true },
    _count: { id: true },
    orderBy: { _sum: { totalAmount: 'desc' } },
  });

  const userIds = grouped.map((g) => g.createdById);
  const users = await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true } });
  const userMap = Object.fromEntries(users.map((u) => [u.id, u.name]));

  return grouped.map((g) => ({
    staffId: g.createdById,
    staffName: userMap[g.createdById] || 'Unknown',
    totalPurchaseAmount: g._sum.totalAmount,
    purchaseCount: g._count.id,
  }));
}
