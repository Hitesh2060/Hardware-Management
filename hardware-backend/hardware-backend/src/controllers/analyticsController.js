import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import * as dashboardService from '../services/analyticsService.js';

export const getSummary = asyncHandler(async (req, res) => {
  const cards = await dashboardService.getSummaryCards();
  res.status(200).json(new ApiResponse(200, cards));
});

export const getTopProducts = asyncHandler(async (req, res) => {
  const data = await dashboardService.getTopProducts(Number(req.query.limit) || 5);
  res.status(200).json(new ApiResponse(200, data));
});

export const getMonthlyTrend = asyncHandler(async (req, res) => {
  const data = await dashboardService.getMonthlyTrend(Number(req.query.months) || 6);
  res.status(200).json(new ApiResponse(200, data));
});

export const getRecentActivity = asyncHandler(async (req, res) => {
  const data = await dashboardService.getRecentActivity(Number(req.query.limit) || 10);
  res.status(200).json(new ApiResponse(200, data));
});
