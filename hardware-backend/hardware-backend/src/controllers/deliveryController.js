import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import * as deliveryService from '../services/deliveryService.js';
import { logActivityNow } from '../middleware/activityLogger.js';

export const createDelivery = asyncHandler(async (req, res) => {
  const delivery = await deliveryService.createDelivery(req.body);
  await logActivityNow({ userId: req.user.id, module: 'Delivery', action: 'CREATE', entityId: delivery.id, ipAddress: req.ip });
  res.status(201).json(new ApiResponse(201, delivery, 'Delivery scheduled'));
});

export const updateDeliveryStatus = asyncHandler(async (req, res) => {
  const delivery = await deliveryService.updateDeliveryStatus(req.params.id, req.body.status);
  await logActivityNow({ userId: req.user.id, module: 'Delivery', action: 'UPDATE_STATUS', entityId: delivery.id, ipAddress: req.ip });
  res.status(200).json(new ApiResponse(200, delivery, 'Delivery status updated'));
});

export const listDeliveries = asyncHandler(async (req, res) => {
  const result = await deliveryService.listDeliveries(req.query);
  res.status(200).json(new ApiResponse(200, result));
});

export const getDelivery = asyncHandler(async (req, res) => {
  const delivery = await deliveryService.getDelivery(req.params.id);
  res.status(200).json(new ApiResponse(200, delivery));
});
