import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import * as ledgerService from '../services/ledgerService.js';


export const getSupplierLedger = asyncHandler(async (req, res) => {
  const result = await ledgerService.getSupplierLedger(
    req.params.supplierId,
    req.query
  );
  res.status(200).json(new ApiResponse(200, result, 'Supplier ledger retrieved'));
});

export const getSupplierSummary = asyncHandler(async (req, res) => {
  const result = await ledgerService.getSupplierSummary(req.params.supplierId);
  res.status(200).json(new ApiResponse(200, result, 'Supplier summary retrieved'));
});


export const getCustomerLedger = asyncHandler(async (req, res) => {
  const result = await ledgerService.getCustomerLedger(
    req.params.customerId,
    req.query
  );
  res.status(200).json(new ApiResponse(200, result, 'Customer ledger retrieved'));
});

export const getCustomerSummary = asyncHandler(async (req, res) => {
  const result = await ledgerService.getCustomerSummary(req.params.customerId);
  res.status(200).json(new ApiResponse(200, result, 'Customer summary retrieved'));
});