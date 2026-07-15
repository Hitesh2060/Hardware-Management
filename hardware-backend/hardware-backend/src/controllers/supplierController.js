import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import * as supplierService from '../services/supplierService.js';
import { logActivityNow } from '../middleware/activityLogger.js';

export const createSupplier = asyncHandler(async (req, res) => {
  const supplier = await supplierService.createSupplier(req.body);
  await logActivityNow({ userId: req.user.id, module: 'Supplier', action: 'CREATE', entityId: supplier.id, ipAddress: req.ip });
  res.status(201).json(new ApiResponse(201, supplier, 'Supplier created'));
});

export const listSuppliers = asyncHandler(async (req, res) => {
  const result = await supplierService.listSuppliers(req.query);
  res.status(200).json(new ApiResponse(200, result));
});

export const getSupplier = asyncHandler(async (req, res) => {
  const supplier = await supplierService.getSupplier(req.params.id);
  res.status(200).json(new ApiResponse(200, supplier));
});

export const updateSupplier = asyncHandler(async (req, res) => {
  const supplier = await supplierService.updateSupplier(req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, supplier, 'Supplier updated'));
});

export const deactivateSupplier = asyncHandler(async (req, res) => {
  await supplierService.deactivateSupplier(req.params.id);
  res.status(200).json(new ApiResponse(200, null, 'Supplier deactivated'));
});
