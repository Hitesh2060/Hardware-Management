import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';
import * as productsService from '../services/productService.js';
import { logActivityNow } from '../middleware/activityLogger.js';

export const createProduct = asyncHandler(async (req, res) => {
  const product = await productsService.createProduct(req.body, req.user.id);
  await logActivityNow({
    userId: req.user.id,
    module: 'Product',
    action: 'CREATE',
    entityId: product.id,
    ipAddress: req.ip,
  });
  res.status(201).json(new ApiResponse(201, product, 'Product created'));
});

export const getProduct = asyncHandler(async (req, res) => {
  const product = await productsService.getProduct(req.params.id);
  res.status(200).json(new ApiResponse(200, product));
});

export const updateProduct = asyncHandler(async (req, res) => {
  const product = await productsService.updateProduct(req.params.id, req.body);
  await logActivityNow({
    userId: req.user.id,
    module: 'Product',
    action: 'UPDATE',
    entityId: product.id,
    ipAddress: req.ip,
  });
  res.status(200).json(new ApiResponse(200, product, 'Product updated'));
});

export const deactivateProduct = asyncHandler(async (req, res) => {
  await productsService.deactivateProduct(req.params.id);
  await logActivityNow({
    userId: req.user.id,
    module: 'Product',
    action: 'DELETE',
    entityId: req.params.id,
    ipAddress: req.ip,
  });
  res.status(200).json(new ApiResponse(200, null, 'Product deactivated'));
});

export const listProducts = asyncHandler(async (req, res) => {
  const result = await productsService.listProducts(req.query);
  res.status(200).json(new ApiResponse(200, result));
});

export const uploadProductImage = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest('No image uploaded');
  const imageUrl = `/uploads/products/${req.file.filename}`;
  const product = await productsService.updateProduct(req.params.id, { imageUrl });
  res.status(200).json(new ApiResponse(200, product, 'Product image updated'));
});
