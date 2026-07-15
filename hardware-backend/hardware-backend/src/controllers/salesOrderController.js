import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import * as salesService from '../services/salesOrderService.js';
import { logActivityNow } from '../middleware/activityLogger.js';

export const createSale = asyncHandler(async (req, res) => {
  const sale = await salesService.createSale(req.body, req.user.id);
  await logActivityNow({
    userId: req.user.id,
    module: 'Sale',
    action: 'CREATE',
    entityId: sale.id,
    ipAddress: req.ip,
  });
  res.status(201).json(new ApiResponse(201, sale, 'Sale completed and stock updated'));
});

export const getSale = asyncHandler(async (req, res) => {
  const sale = await salesService.getSale(req.params.id);
  res.status(200).json(new ApiResponse(200, sale));
});

export const listSales = asyncHandler(async (req, res) => {
  const result = await salesService.listSales(req.query);
  res.status(200).json(new ApiResponse(200, result));
});

export const cancelSale = asyncHandler(async (req, res) => {
  const sale = await salesService.cancelSale(req.params.id, req.user.id);
  await logActivityNow({
    userId: req.user.id,
    module: 'Sale',
    action: 'CANCEL',
    entityId: sale.id,
    ipAddress: req.ip,
  });
  res.status(200).json(new ApiResponse(200, sale, 'Sale cancelled and stock reversed'));
});
