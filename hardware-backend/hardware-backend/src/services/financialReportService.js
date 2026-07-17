import prisma from '../config/database.js';
import { getCurrentStock } from './stockService.js';

/**
 * Helper to convert date string to ISO DateTime
 */
function toISODate(dateStr) {
  if (!dateStr) return undefined;
  return new Date(dateStr).toISOString();
}

/**
 * Generate Profit & Loss Statement
 */
export async function generateProfitLoss({ from, to }) {
  // Convert dates to ISO format
  const fromDate = from ? new Date(from).toISOString() : undefined;
  const toDate = to ? new Date(to).toISOString() : undefined;

  // 1. Sales Summary
  const sales = await prisma.sale.aggregate({
    where: {
      status: 'COMPLETED',
      ...(fromDate || toDate ? { 
        saleDate: { 
          ...(fromDate ? { gte: fromDate } : {}),
          ...(toDate ? { lte: toDate } : {})
        } 
      } : {}),
    },
    _sum: {
      totalAmount: true,
      discountAmount: true,
      taxAmount: true,
    },
  });

  // 2. Purchase Summary
  const purchases = await prisma.purchase.aggregate({
    where: {
      status: 'RECEIVED',
      ...(fromDate || toDate ? { 
        purchaseDate: { 
          ...(fromDate ? { gte: fromDate } : {}),
          ...(toDate ? { lte: toDate } : {})
        } 
      } : {}),
    },
    _sum: {
      totalAmount: true,
    },
  });

  // 3. Stock Adjustment Financial Impact
  const adjustments = await prisma.stockAdjustment.aggregate({
    where: {
      ...(fromDate || toDate ? { 
        createdAt: { 
          ...(fromDate ? { gte: fromDate } : {}),
          ...(toDate ? { lte: toDate } : {})
        } 
      } : {}),
    },
    _sum: {
      financialImpact: true,
      totalValue: true,
    },
  });

  // 4. Expenses
  const expenses = await prisma.expense.aggregate({
    where: {
      ...(fromDate || toDate ? { 
        expenseDate: { 
          ...(fromDate ? { gte: fromDate } : {}),
          ...(toDate ? { lte: toDate } : {})
        } 
      } : {}),
    },
    _sum: {
      amount: true,
    },
  });

  // 5. Inventory Valuation
  const products = await prisma.product.findMany({
    where: { isActive: true },
    select: { id: true, costPrice: true },
  });

  let totalInventoryValue = 0;
  for (const product of products) {
    const stock = await getCurrentStock(prisma, product.id);
    totalInventoryValue += Number(stock) * Number(product.costPrice);
  }

  const totalSales = sales._sum.totalAmount || 0;
  const totalPurchases = purchases._sum.totalAmount || 0;
  const adjustmentLoss = adjustments._sum.financialImpact < 0 
    ? Math.abs(adjustments._sum.financialImpact || 0) 
    : 0;
  const adjustmentGain = adjustments._sum.financialImpact > 0 
    ? (adjustments._sum.financialImpact || 0) 
    : 0;
  const totalExpenses = expenses._sum.amount || 0;

  // COGS = Total Purchases - Adjustment Loss + Adjustment Gain
  const cogs = totalPurchases - adjustmentLoss + adjustmentGain;
  
  // Gross Profit = Sales - COGS
  const grossProfit = totalSales - cogs;
  
  // Net Profit = Gross Profit - Expenses
  const netProfit = grossProfit - totalExpenses;

  return {
    period: { from, to },
    revenue: {
      sales: totalSales,
      discount: sales._sum.discountAmount || 0,
      tax: sales._sum.taxAmount || 0,
    },
    costOfGoodsSold: {
      purchases: totalPurchases,
      adjustmentLoss: adjustmentLoss,
      adjustmentGain: adjustmentGain,
      cogs: cogs,
    },
    grossProfit: grossProfit,
    expenses: {
      total: totalExpenses,
    },
    netProfit: netProfit,
    inventoryValue: totalInventoryValue,
  };
}

/**
 * Get Stock Adjustment Financial Report
 */
export async function getStockAdjustmentFinancialReport({ from, to }) {
  // Convert dates to ISO format
  const fromDate = from ? new Date(from).toISOString() : undefined;
  const toDate = to ? new Date(to).toISOString() : undefined;

  const where = {
    ...(fromDate || toDate ? { 
      createdAt: { 
        ...(fromDate ? { gte: fromDate } : {}),
        ...(toDate ? { lte: toDate } : {})
      } 
    } : {}),
  };

  const adjustments = await prisma.stockAdjustment.findMany({
    where,
    include: {
      product: {
        select: { id: true, name: true, sku: true },
      },
      createdBy: {
        select: { id: true, name: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const summary = {
    totalAdjustments: adjustments.length,
    totalLoss: adjustments
      .filter(a => a.type === 'DECREASE')
      .reduce((sum, a) => sum + Number(a.totalValue), 0),
    totalGain: adjustments
      .filter(a => a.type === 'INCREASE')
      .reduce((sum, a) => sum + Number(a.totalValue), 0),
    netImpact: adjustments.reduce((sum, a) => sum + Number(a.financialImpact), 0),
    totalQuantityLost: adjustments
      .filter(a => a.type === 'DECREASE')
      .reduce((sum, a) => sum + Number(a.quantity), 0),
    totalQuantityGained: adjustments
      .filter(a => a.type === 'INCREASE')
      .reduce((sum, a) => sum + Number(a.quantity), 0),
  };

  return { adjustments, summary };
}