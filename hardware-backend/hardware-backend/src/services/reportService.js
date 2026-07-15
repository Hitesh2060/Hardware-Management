import prisma from '../config/database.js';

export async function getSalesReport({ from, to, groupBy = 'day' }) {
  const sales = await prisma.sale.findMany({
    where: { saleDate: { gte: from, lte: to }, status: 'COMPLETED' },
    select: { saleDate: true, totalAmount: true, taxAmount: true, discountAmount: true },
  });

  const buckets = {};
  for (const s of sales) {
    const key =
      groupBy === 'month'
        ? `${s.saleDate.getFullYear()}-${String(s.saleDate.getMonth() + 1).padStart(2, '0')}`
        : s.saleDate.toISOString().slice(0, 10);
    buckets[key] = buckets[key] || { totalSales: 0, totalTax: 0, totalDiscount: 0, invoiceCount: 0 };
    buckets[key].totalSales += Number(s.totalAmount);
    buckets[key].totalTax += Number(s.taxAmount);
    buckets[key].totalDiscount += Number(s.discountAmount);
    buckets[key].invoiceCount += 1;
  }

  return Object.entries(buckets)
    .sort(([a], [b]) => (a > b ? 1 : -1))
    .map(([period, data]) => ({ period, ...data }));
}

export async function getPurchaseReport({ from, to }) {
  const purchases = await prisma.purchase.findMany({
    where: { purchaseDate: { gte: from, lte: to }, status: 'RECEIVED' },
    include: { supplier: true },
    orderBy: { purchaseDate: 'desc' },
  });
  const totalAmount = purchases.reduce((sum, p) => sum + Number(p.totalAmount), 0);
  return { purchases, totalAmount, count: purchases.length };
}

/** Profit = revenue - COGS (product.costPrice at read time) - expenses, for a date range. */
export async function getProfitReport({ from, to }) {
  const saleItems = await prisma.saleItem.findMany({
    where: { sale: { saleDate: { gte: from, lte: to }, status: 'COMPLETED' } },
    include: { product: true },
  });

  const revenue = saleItems.reduce((sum, i) => sum + Number(i.lineTotal), 0);
  const cogs = saleItems.reduce((sum, i) => sum + Number(i.product.costPrice) * Number(i.quantity), 0);

  const expenses = await prisma.expense.aggregate({
    where: { expenseDate: { gte: from, lte: to } },
    _sum: { amount: true },
  });

  const totalExpenses = Number(expenses._sum.amount || 0);
  const grossProfit = revenue - cogs;
  const netProfit = grossProfit - totalExpenses;

  return { revenue, cogs, grossProfit, totalExpenses, netProfit };
}

export async function getExpenseReport({ from, to }) {
  const expenses = await prisma.expense.findMany({
    where: { expenseDate: { gte: from, lte: to } },
    orderBy: { expenseDate: 'desc' },
  });
  const byCategory = {};
  for (const e of expenses) {
    byCategory[e.category] = (byCategory[e.category] || 0) + Number(e.amount);
  }
  return { expenses, byCategory, total: expenses.reduce((s, e) => s + Number(e.amount), 0) };
}

/** Full stock valuation — current stock x cost price, per product. */
export async function getStockValuationReport() {
  const products = await prisma.product.findMany({ where: { isActive: true } });
  const rows = [];
  let totalValuation = 0;

  for (const p of products) {
    const agg = await prisma.stockMovement.aggregate({ where: { productId: p.id }, _sum: { quantity: true } });
    const stock = Number(agg._sum.quantity || 0);
    const value = stock * Number(p.costPrice);
    totalValuation += value;
    rows.push({ product: p.name, sku: p.sku, currentStock: stock, costPrice: p.costPrice, valuation: value });
  }

  return { rows, totalValuation };
}

/** "Dead stock" — products with zero sales in the given window but positive stock. */
export async function getDeadStockReport({ sinceDays = 90 } = {}) {
  const since = new Date();
  since.setDate(since.getDate() - sinceDays);

  const recentlySoldProductIds = new Set(
    (
      await prisma.saleItem.findMany({
        where: { sale: { saleDate: { gte: since }, status: 'COMPLETED' } },
        select: { productId: true },
        distinct: ['productId'],
      })
    ).map((i) => i.productId)
  );

  const products = await prisma.product.findMany({ where: { isActive: true } });
  const deadStock = [];
  for (const p of products) {
    if (recentlySoldProductIds.has(p.id)) continue;
    const agg = await prisma.stockMovement.aggregate({ where: { productId: p.id }, _sum: { quantity: true } });
    const stock = Number(agg._sum.quantity || 0);
    if (stock > 0) deadStock.push({ ...p, currentStock: stock });
  }
  return deadStock;
}

/** "Fast moving" — top N products by quantity sold in the window. */
export async function getFastMovingItemsReport({ sinceDays = 30, limit = 10 } = {}) {
  const since = new Date();
  since.setDate(since.getDate() - sinceDays);

  const grouped = await prisma.saleItem.groupBy({
    by: ['productId'],
    where: { sale: { saleDate: { gte: since }, status: 'COMPLETED' } },
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: 'desc' } },
    take: limit,
  });

  const productIds = grouped.map((g) => g.productId);
  const products = await prisma.product.findMany({ where: { id: { in: productIds } } });
  const productMap = Object.fromEntries(products.map((p) => [p.id, p]));

  return grouped.map((g) => ({ product: productMap[g.productId], quantitySold: g._sum.quantity }));
}
