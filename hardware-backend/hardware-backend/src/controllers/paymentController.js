import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import * as paymentService from '../services/paymentService.js';
import { logActivityNow } from '../middleware/activityLogger.js';

export const recordCustomerPayment = asyncHandler(async (req, res) => {
  const payment = await paymentService.recordCustomerPayment(req.body);
  await logActivityNow({ userId: req.user.id, module: 'Payment', action: 'CUSTOMER_PAYMENT', entityId: payment.id, ipAddress: req.ip });
  res.status(201).json(new ApiResponse(201, payment, 'Payment recorded'));
});

export const recordSupplierPayment = asyncHandler(async (req, res) => {
  const payment = await paymentService.recordSupplierPayment(req.body);
  await logActivityNow({ userId: req.user.id, module: 'Payment', action: 'SUPPLIER_PAYMENT', entityId: payment.id, ipAddress: req.ip });
  res.status(201).json(new ApiResponse(201, payment, 'Payment recorded'));
});

export const listPayments = asyncHandler(async (req, res) => {
  const result = await paymentService.listPayments(req.query);
  res.status(200).json(new ApiResponse(200, result));
});

export const getPayment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const payment = await paymentService.getPayment(id);
  res.status(200).json(new ApiResponse(200, payment, 'Payment retrieved'));
});