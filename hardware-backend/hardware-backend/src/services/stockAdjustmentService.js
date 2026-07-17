import prisma from '../config/database.js';
import ApiError from '../utils/ApiError.js';
import { getCurrentStock } from './stockService.js';

/**
 * Create a stock adjustment with financial tracking
 */
export async function createStockAdjustment(data, userId) {
  const { productId, type, quantity, reason } = data;

  return prisma.$transaction(async (tx) => {
    // 1. Get product with current cost
    const product = await tx.product.findUnique({
      where: { id: productId },
      select: { id: true, costPrice: true, name: true, isActive: true }
    });
    
    if (!product || !product.isActive) {
      throw ApiError.badRequest('Product not found or inactive');
    }

    // 2. Check current stock
    const currentStock = await getCurrentStock(tx, productId);
    
    // 3. For DECREASE, ensure sufficient stock
    if (type === 'DECREASE' && Number(currentStock) < Number(quantity)) {
      throw ApiError.badRequest(
        `Cannot decrease ${quantity} units. Only ${currentStock} units available.`
      );
    }

    // 4. Calculate financial values
    const unitCost = Number(product.costPrice);
    const totalValue = quantity * unitCost;
    const financialImpact = type === 'INCREASE' ? totalValue : -totalValue;

    // 5. Create stock adjustment record with financial data
    const adjustment = await tx.stockAdjustment.create({
      data: {
        productId,
        type,
        quantity,
        unitCost,
        totalValue,
        financialImpact,
        reason,
        createdById: userId,
      },
    });

    // 6. Create stock movement with financial data
    const movementType = type === 'INCREASE' ? 'ADJUSTMENT_IN' : 'ADJUSTMENT_OUT';
    const movementQuantity = type === 'INCREASE' ? quantity : -quantity;

    const currentBalance = await getCurrentStock(tx, productId);
    const balanceAfter = Number(currentBalance) + Number(movementQuantity);

    await tx.stockMovement.create({
      data: {
        productId,
        type: movementType,
        quantity: movementQuantity,
        balanceAfter,
        unitCost: unitCost,
        totalValue: movementQuantity * unitCost,
        referenceType: 'StockAdjustment',
        referenceId: adjustment.id,
        stockAdjustmentId: adjustment.id,
        note: reason,
        createdById: userId,
      },
    });

    // 7. Return adjustment with financial details
    return {
      ...adjustment,
      unitCost,
      totalValue,
      financialImpact,
      currentStockBefore: currentStock,
      currentStockAfter: Number(currentStock) + movementQuantity,
    };
  });
}

/**
 * List stock adjustments with pagination
 */
export async function listStockAdjustments({ page = 1, limit = 20, productId }) {
  const parsedPage = Math.max(1, parseInt(String(page)) || 1);
  const parsedLimit = Math.min(100, Math.max(1, parseInt(String(limit)) || 20));
  const skip = (parsedPage - 1) * parsedLimit;

  const where = {
    ...(productId ? { productId } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.stockAdjustment.findMany({
      where,
      include: {
        product: {
          select: { id: true, name: true, sku: true, costPrice: true },
        },
        createdBy: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: skip,
      take: parsedLimit,
    }),
    prisma.stockAdjustment.count({ where }),
  ]);

  return {
    items,
    pagination: {
      page: parsedPage,
      limit: parsedLimit,
      total,
      totalPages: Math.ceil(total / parsedLimit),
    },
  };
}

/**
 * Get stock adjustment report with financial summary
 */
export async function getAdjustmentReport({ from, to, productId }) {
  const where = {
    ...(productId ? { productId } : {}),
    ...(from || to ? { createdAt: { gte: from, lte: to } } : {}),
  };

  const adjustments = await prisma.stockAdjustment.findMany({
    where,
    include: {
      product: {
        select: { id: true, name: true, sku: true, costPrice: true },
      },
      createdBy: {
        select: { id: true, name: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const summary = {
    totalAdjustments: adjustments.length,
    totalQuantity: adjustments.reduce((sum, a) => sum + Number(a.quantity), 0),
    totalFinancialImpact: adjustments.reduce((sum, a) => sum + Number(a.financialImpact), 0),
    totalLoss: adjustments
      .filter(a => a.type === 'DECREASE')
      .reduce((sum, a) => sum + Number(a.totalValue), 0),
    totalGain: adjustments
      .filter(a => a.type === 'INCREASE')
      .reduce((sum, a) => sum + Number(a.totalValue), 0),
  };

  return { adjustments, summary };
}

/**
 * Get financial summary for stock adjustments
 */
export async function getFinancialSummary({ from, to }) {
  const adjustments = await prisma.stockAdjustment.findMany({
    where: {
      ...(from || to ? { createdAt: { gte: from, lte: to } } : {}),
    },
  });

  const totalLoss = adjustments
    .filter(a => a.type === 'DECREASE')
    .reduce((sum, a) => sum + Number(a.totalValue), 0);

  const totalGain = adjustments
    .filter(a => a.type === 'INCREASE')
    .reduce((sum, a) => sum + Number(a.totalValue), 0);

  return {
    totalAdjustments: adjustments.length,
    totalLoss,
    totalGain,
    netImpact: totalGain - totalLoss,
  };
}