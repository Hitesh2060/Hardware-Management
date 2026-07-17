import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import * as ledgerService from '../services/ledgerService.js';

// ============================================
// CUSTOMER LEDGER
// ============================================

export const getCustomerLedger = asyncHandler(async (req, res) => {
  const { customerId } = req.params;
  const result = await ledgerService.getCustomerLedger(customerId, req.query);
  res.status(200).json(new ApiResponse(200, result, 'Customer ledger retrieved'));
});

export const getCustomerLedgerSummary = asyncHandler(async (req, res) => {
  const { customerId } = req.params;
  const result = await ledgerService.getCustomerLedgerSummary(customerId);
  res.status(200).json(new ApiResponse(200, result, 'Customer ledger summary retrieved'));
});

export const rebuildCustomerLedger = asyncHandler(async (req, res) => {
  const { customerId } = req.params;
  const result = await ledgerService.rebuildCustomerLedger(customerId);
  res.status(200).json(new ApiResponse(200, result, 'Customer ledger rebuilt'));
});

// ============================================
// SUPPLIER LEDGER
// ============================================

export const getSupplierLedger = asyncHandler(async (req, res) => {
  const { supplierId } = req.params;
  const result = await ledgerService.getSupplierLedger(supplierId, req.query);
  res.status(200).json(new ApiResponse(200, result, 'Supplier ledger retrieved'));
});

export const getSupplierLedgerSummary = asyncHandler(async (req, res) => {
  const { supplierId } = req.params;
  const result = await ledgerService.getSupplierLedgerSummary(supplierId);
  res.status(200).json(new ApiResponse(200, result, 'Supplier ledger summary retrieved'));
});

export const rebuildSupplierLedger = asyncHandler(async (req, res) => {
  const { supplierId } = req.params;
  const result = await ledgerService.rebuildSupplierLedger(supplierId);
  res.status(200).json(new ApiResponse(200, result, 'Supplier ledger rebuilt'));
});