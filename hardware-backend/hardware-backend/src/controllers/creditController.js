import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import * as creditService from '../services/creditService.js';

export const getCustomerDueReport = asyncHandler(async (req, res) => {
  const report = await creditService.getCustomerDueReport();
  res.status(200).json(new ApiResponse(200, report));
});

export const getSupplierDueReport = asyncHandler(async (req, res) => {
  const report = await creditService.getSupplierDueReport();
  res.status(200).json(new ApiResponse(200, report));
});

export const getOverdueCustomers = asyncHandler(async (req, res) => {
  const days = Number(req.query.days) || 30;
  const overdue = await creditService.getOverdueCustomers(days);
  res.status(200).json(new ApiResponse(200, overdue));
});
