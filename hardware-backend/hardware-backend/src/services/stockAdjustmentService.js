import prisma from '../config/database.js';
import ApiError from '../utils/ApiError.js';
import { applyStockAdjustment } from './stockService.js';

/**
 * Creates a StockAdjustment record AND its corresponding ledger movement in
 * one transaction. This is the only place in the entire codebase that is
 * allowed to change stock without a Purchase/Sale/Return/Damage document
 * behind it — and even here, a `reason` is mandatory (enforced by
 * stockAdjustmentValidation.js) so it's always auditable.
 */
export async function createStockAdjustment({ productId, type, quantity, reason }, userId) {
  return prisma.$transaction(async (tx) => {
    const product = await tx.product.findUnique({ where: { id: productId } });
    if (!product || !product.isActive) throw ApiError.badRequest('Invalid product');

    const adjustment = await tx.stockAdjustment.create({
      data: { productId, type, quantity, reason, createdById: userId },
    });

    await applyStockAdjustment(tx, {
      productId,
      type,
      quantity,
      stockAdjustmentId: adjustment.id,
      createdById: userId,
    });

    return adjustment;
  });
}

export async function listStockAdjustments({ productId, page = 1, limit = 20 }) {
  const where = productId ? { productId } : {};
  const [items, total] = await Promise.all([
    prisma.stockAdjustment.findMany({
      where,
      include: { product: true, createdBy: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.stockAdjustment.count({ where }),
  ]);
  return { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}
