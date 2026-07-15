import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import prisma from '../config/database.js';
import ApiError from '../utils/ApiError.js';
import { getCurrentStock, getStockLedger } from '../services/stockService.js';

/**
 * Read-only endpoints. All WRITES to stock happen implicitly through
 * Purchase/Sale/Return/Damage/Adjustment endpoints — there is intentionally
 * no "PUT /stock/:id" here. See stockAdjustmentController.js for the one
 * sanctioned manual-correction path, which still goes through the same
 * stockService.applyStockAdjustment() ledger function.
 */

export const getCurrentStockLevel = asyncHandler(async (req, res) => {
  const product = await prisma.product.findUnique({ where: { id: req.params.productId } });
  if (!product) throw ApiError.notFound('Product not found');

  const currentStock = await getCurrentStock(prisma, product.id);
  res.status(200).json(new ApiResponse(200, { product: product.name, sku: product.sku, currentStock }));
});

export const getLedger = asyncHandler(async (req, res) => {
  const { from, to } = req.query;
  const ledger = await getStockLedger(prisma, req.params.productId, {
    from: from ? new Date(from) : undefined,
    to: to ? new Date(to) : undefined,
  });
  res.status(200).json(new ApiResponse(200, ledger));
});

export const getLowStockList = asyncHandler(async (req, res) => {
  const products = await prisma.product.findMany({ where: { isActive: true } });
  const results = [];
  for (const p of products) {
    const stock = await getCurrentStock(prisma, p.id);
    if (Number(stock) <= p.reorderLevel) results.push({ ...p, currentStock: stock });
  }
  res.status(200).json(new ApiResponse(200, results));
});
