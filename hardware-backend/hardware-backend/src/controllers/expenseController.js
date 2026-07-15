import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import * as expenseService from '../services/expenseService.js';
import { logActivityNow } from '../middleware/activityLogger.js';

export const createExpense = asyncHandler(async (req, res) => {
  const expense = await expenseService.createExpense(req.body);
  await logActivityNow({ userId: req.user.id, module: 'Expense', action: 'CREATE', entityId: expense.id, ipAddress: req.ip });
  res.status(201).json(new ApiResponse(201, expense, 'Expense recorded'));
});

export const listExpenses = asyncHandler(async (req, res) => {
  const result = await expenseService.listExpenses(req.query);
  res.status(200).json(new ApiResponse(200, result));
});

export const deleteExpense = asyncHandler(async (req, res) => {
  await expenseService.deleteExpense(req.params.id);
  res.status(200).json(new ApiResponse(200, null, 'Expense deleted'));
});
