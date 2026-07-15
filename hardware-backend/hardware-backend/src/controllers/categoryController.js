import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import * as categoryService from '../services/categoryService.js';
import { logActivityNow } from '../middleware/activityLogger.js';

export const createCategory = asyncHandler(async (req, res) => {
  const category = await categoryService.createCategory(req.body);
  await logActivityNow({ userId: req.user.id, module: 'Category', action: 'CREATE', entityId: category.id, ipAddress: req.ip });
  res.status(201).json(new ApiResponse(201, category, 'Category created'));
});

export const listCategories = asyncHandler(async (req, res) => {
  const categories = await categoryService.listCategories();
  res.status(200).json(new ApiResponse(200, categories));
});

export const getCategory = asyncHandler(async (req, res) => {
  const category = await categoryService.getCategory(req.params.id);
  res.status(200).json(new ApiResponse(200, category));
});

export const updateCategory = asyncHandler(async (req, res) => {
  const category = await categoryService.updateCategory(req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, category, 'Category updated'));
});

export const deactivateCategory = asyncHandler(async (req, res) => {
  await categoryService.deactivateCategory(req.params.id);
  res.status(200).json(new ApiResponse(200, null, 'Category deactivated'));
});
