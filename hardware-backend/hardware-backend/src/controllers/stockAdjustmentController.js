import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import * as stockAdjustmentService from '../services/stockAdjustmentService.js';
import { logActivityNow } from '../middleware/activityLogger.js';

export const createStockAdjustment = asyncHandler(async (req, res) => {
  const adjustment = await stockAdjustmentService.createStockAdjustment(req.body, req.user.id);
  await logActivityNow({
    userId: req.user.id,
    module: 'StockAdjustment',
    action: 'CREATE',
    entityId: adjustment.id,
    ipAddress: req.ip,
    metadata: { reason: req.body.reason },
  });
  res.status(201).json(new ApiResponse(201, adjustment, 'Stock adjustment recorded'));
});

export const listStockAdjustments = asyncHandler(async (req, res) => {
  const result = await stockAdjustmentService.listStockAdjustments(req.query);
  res.status(200).json(new ApiResponse(200, result));
});
