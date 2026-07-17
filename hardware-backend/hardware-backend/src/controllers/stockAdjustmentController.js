import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import * as stockAdjustmentService from '../services/stockAdjustmentService.js';
import { logActivityNow } from '../middleware/activityLogger.js';

// Create stock adjustment with financial tracking
export const createStockAdjustment = asyncHandler(async (req, res) => {
  const adjustment = await stockAdjustmentService.createStockAdjustment(
    req.body,
    req.user.id
  );
  
  await logActivityNow({
    userId: req.user.id,
    module: 'StockAdjustment',
    action: 'CREATE',
    entityId: adjustment.id,
    ipAddress: req.ip,
  });
  
  res.status(201).json(new ApiResponse(201, adjustment, 'Stock adjustment created'));
});

// List stock adjustments
export const listStockAdjustments = asyncHandler(async (req, res) => {
  const result = await stockAdjustmentService.listStockAdjustments(req.query);
  res.status(200).json(new ApiResponse(200, result, 'Stock adjustments retrieved'));
});

// Get adjustment report with financial summary
export const getAdjustmentReport = asyncHandler(async (req, res) => {
  const result = await stockAdjustmentService.getAdjustmentReport(req.query);
  res.status(200).json(new ApiResponse(200, result, 'Adjustment report generated'));
});

// Get financial summary
export const getFinancialSummary = asyncHandler(async (req, res) => {
  const result = await stockAdjustmentService.getFinancialSummary(req.query);
  res.status(200).json(new ApiResponse(200, result, 'Financial summary generated'));
});