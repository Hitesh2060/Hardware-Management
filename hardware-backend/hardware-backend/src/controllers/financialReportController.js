import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import * as financialReportService from '../services/financialReportService.js';

// Get Profit & Loss Statement
export const getProfitLoss = asyncHandler(async (req, res) => {
  const { from, to } = req.query;
  const result = await financialReportService.generateProfitLoss({ from, to });
  res.status(200).json(new ApiResponse(200, result, 'Profit & Loss statement generated'));
});

// Get Stock Adjustment Financial Report
export const getStockAdjustmentFinancialReport = asyncHandler(async (req, res) => {
  const { from, to } = req.query;
  const result = await financialReportService.getStockAdjustmentFinancialReport({ from, to });
  res.status(200).json(new ApiResponse(200, result, 'Stock adjustment financial report generated'));
});