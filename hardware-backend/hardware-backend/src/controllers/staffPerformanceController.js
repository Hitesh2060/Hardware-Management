import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import * as staffPerformanceService from '../services/staffPerformanceService.js';

function parseDateRange(query) {
  const to = query.to ? new Date(query.to) : new Date();
  const from = query.from ? new Date(query.from) : new Date(new Date().setDate(to.getDate() - 30));
  return { from, to };
}

export const getSalesStaffPerformance = asyncHandler(async (req, res) => {
  const { from, to } = parseDateRange(req.query);
  const data = await staffPerformanceService.getSalesStaffPerformance({ from, to });
  res.status(200).json(new ApiResponse(200, data));
});

export const getPurchaseStaffPerformance = asyncHandler(async (req, res) => {
  const { from, to } = parseDateRange(req.query);
  const data = await staffPerformanceService.getPurchaseStaffPerformance({ from, to });
  res.status(200).json(new ApiResponse(200, data));
});
