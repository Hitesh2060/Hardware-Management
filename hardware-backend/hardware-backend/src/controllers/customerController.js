import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import * as customerService from '../services/customerService.js';
import { logActivityNow } from '../middleware/activityLogger.js';

export const createCustomer = asyncHandler(async (req, res) => {
  const customer = await customerService.createCustomer(req.body);
  await logActivityNow({ userId: req.user.id, module: 'Customer', action: 'CREATE', entityId: customer.id, ipAddress: req.ip });
  res.status(201).json(new ApiResponse(201, customer, 'Customer created'));
});

export const listCustomers = asyncHandler(async (req, res) => {
  const result = await customerService.listCustomers(req.query);
  res.status(200).json(new ApiResponse(200, result));
});

export const getCustomer = asyncHandler(async (req, res) => {
  const customer = await customerService.getCustomer(req.params.id);
  res.status(200).json(new ApiResponse(200, customer));
});

export const updateCustomer = asyncHandler(async (req, res) => {
  const customer = await customerService.updateCustomer(req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, customer, 'Customer updated'));
});

export const deactivateCustomer = asyncHandler(async (req, res) => {
  await customerService.deactivateCustomer(req.params.id);
  res.status(200).json(new ApiResponse(200, null, 'Customer deactivated'));
});
