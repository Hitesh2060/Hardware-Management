import prisma from '../config/database.js';

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function getSummaryCards() {
  const today = startOfToday();

  const [todaySales, todayPurchases, todayExpenses, lowStockProducts, outOfStockCount] =
    await Promise.all([
      prisma.sale.aggregate({ where: { saleDate: { gte: today }, status: 'COMPLETED' }, _sum: { totalAmount: true } }),
      prisma.purchase.aggregate({ where: { purchaseDate: { gte: today }, status: 'RECEIVED' }, _sum: { totalAmount: true } }),
      prisma.expense.aggregate({ where: { expenseDate: { gte: today } }, _sum: { amount: true } }),
      getLowStockProducts(),
      getOutOfStockCount(),
    ]);

  // Today's profit ≈ today's sale revenue - COGS of items sold today - today's expenses.
  // COGS uses each SaleItem's product.costPrice at time of read (informational
  // costing). For exact historical costing (FIFO/weighted-avg), extend
  // PurchaseItem-to-SaleItem cost allocation — noted in Future Scalability plan.
  const todaySaleItems = await prisma.saleItem.findMany({
    where: { sale: { saleDate: { gte: today }, status: 'COMPLETED' } },
    include: { product: true },
  });
  const todayCogs = todaySaleItems.reduce(
    (sum, item) => sum + Number(item.product.costPrice) * Number(item.quantity),
    0
  );
  const todayRevenue = Number(todaySales._sum.totalAmount || 0);
  const todayProfit = todayRevenue - todayCogs - Number(todayExpenses._sum.amount || 0);

  return {
    todaySales: todayRevenue,
    todayPurchases: Number(todayPurchases._sum.totalAmount || 0),
    todayExpenses: Number(todayExpenses._sum.amount || 0),
    todayProfit,
    lowStockCount: lowStockProducts.length,
    outOfStockCount,
  };
}

async function getLowStockProducts() {
  const products = await prisma.product.findMany({ where: { isActive: true } });
  const results = [];
  for (const p of products) {
    const agg = await prisma.stockMovement.aggregate({
      where: { productId: p.id },
      _sum: { quantity: true },
    });
    const stock = Number(agg._sum.quantity || 0);
    if (stock <= p.reorderLevel) results.push({ ...p, currentStock: stock });
  }
  return results;
}

async function getOutOfStockCount() {
  const lowStock = await getLowStockProducts();
  return lowStock.filter((p) => p.currentStock <= 0).length;
}

export async function getTopProducts(limit = 5) {
  const grouped = await prisma.saleItem.groupBy({
    by: ['productId'],
    _sum: { quantity: true, lineTotal: true },
    orderBy: { _sum: { lineTotal: 'desc' } },
    take: limit,
  });

  const productIds = grouped.map((g) => g.productId);
  const products = await prisma.product.findMany({ where: { id: { in: productIds } } });
  const productMap = Object.fromEntries(products.map((p) => [p.id, p]));

  return grouped.map((g) => ({
    product: productMap[g.productId],
    totalQuantitySold: g._sum.quantity,
    totalRevenue: g._sum.lineTotal,
  }));
}

/** Monthly sales/profit trend for the last N months — powers dashboard charts. */
export async function getMonthlyTrend(months = 6) {
  const since = new Date();
  since.setMonth(since.getMonth() - (months - 1));
  since.setDate(1);
  since.setHours(0, 0, 0, 0);

  const sales = await prisma.sale.findMany({
    where: { saleDate: { gte: since }, status: 'COMPLETED' },
    select: { saleDate: true, totalAmount: true },
  });

  const buckets = {};
  for (const s of sales) {
    const key = `${s.saleDate.getFullYear()}-${String(s.saleDate.getMonth() + 1).padStart(2, '0')}`;
    buckets[key] = (buckets[key] || 0) + Number(s.totalAmount);
  }

  return Object.entries(buckets)
    .sort(([a], [b]) => (a > b ? 1 : -1))
    .map(([month, totalSales]) => ({ month, totalSales }));
}

export async function getRecentActivity(limit = 10) {
  return prisma.activityLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: { user: { select: { name: true } } },
  });
}
