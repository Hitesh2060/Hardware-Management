import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import * as purchasesService from '../services/purchaseOrderService.js';
import { logActivityNow } from '../middleware/activityLogger.js';

export const createPurchase = asyncHandler(async (req, res) => {
  const purchase = await purchasesService.createPurchase(req.body, req.user.id);
  await logActivityNow({
    userId: req.user.id,
    module: 'Purchase',
    action: 'CREATE',
    entityId: purchase.id,
    ipAddress: req.ip,
  });
  res.status(201).json(new ApiResponse(201, purchase, 'Purchase created'));
});

export const getPurchase = asyncHandler(async (req, res) => {
  const purchase = await purchasesService.getPurchase(req.params.id);
  res.status(200).json(new ApiResponse(200, purchase));
});

export const listPurchases = asyncHandler(async (req, res) => {
  const result = await purchasesService.listPurchases(req.query);
  res.status(200).json(new ApiResponse(200, result));
});

export const cancelPurchase = asyncHandler(async (req, res) => {
  const purchase = await purchasesService.cancelPurchase(req.params.id, req.user.id);
  await logActivityNow({
    userId: req.user.id,
    module: 'Purchase',
    action: 'CANCEL',
    entityId: purchase.id,
    ipAddress: req.ip,
  });
  res.status(200).json(new ApiResponse(200, purchase, 'Purchase cancelled and stock reversed'));
});

// New: Receive a DRAFT purchase
export const receivePurchase = asyncHandler(async (req, res) => {
  const purchase = await purchasesService.receivePurchase(req.params.id, req.user.id);
  await logActivityNow({
    userId: req.user.id,
    module: 'Purchase',
    action: 'RECEIVE',
    entityId: purchase.id,
    ipAddress: req.ip,
  });
  res.status(200).json(new ApiResponse(200, purchase, 'Purchase received and stock updated'));
});

// New: Update a DRAFT purchase
export const updateDraftPurchase = asyncHandler(async (req, res) => {
  const purchase = await purchasesService.updateDraftPurchase(req.params.id, req.body, req.user.id);
  await logActivityNow({
    userId: req.user.id,
    module: 'Purchase',
    action: 'UPDATE_DRAFT',
    entityId: purchase.id,
    ipAddress: req.ip,
  });
  res.status(200).json(new ApiResponse(200, purchase, 'Draft purchase updated'));
});