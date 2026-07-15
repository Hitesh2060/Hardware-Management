import prisma from '../config/database.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';

/**
 * Brand and Unit are simple lookup tables (no children, no complex rules),
 * so — unlike Category/Supplier/Customer — they're kept as one lightweight
 * controller instead of a full service/repository split. Split them out the
 * same way as categoryController.js if they grow more business logic later.
 */

export const listBrands = asyncHandler(async (req, res) => {
  const brands = await prisma.brand.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } });
  res.status(200).json(new ApiResponse(200, brands));
});

export const createBrand = asyncHandler(async (req, res) => {
  const { name } = req.body;
  const existing = await prisma.brand.findUnique({ where: { name } });
  if (existing) throw ApiError.conflict(`Brand "${name}" already exists`);
  const brand = await prisma.brand.create({ data: { name } });
  res.status(201).json(new ApiResponse(201, brand, 'Brand created'));
});

export const deactivateBrand = asyncHandler(async (req, res) => {
  await prisma.brand.update({ where: { id: req.params.id }, data: { isActive: false } });
  res.status(200).json(new ApiResponse(200, null, 'Brand deactivated'));
});

export const listUnits = asyncHandler(async (req, res) => {
  const units = await prisma.unit.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } });
  res.status(200).json(new ApiResponse(200, units));
});

export const createUnit = asyncHandler(async (req, res) => {
  const { name, shortCode } = req.body;
  const existing = await prisma.unit.findUnique({ where: { name } });
  if (existing) throw ApiError.conflict(`Unit "${name}" already exists`);
  const unit = await prisma.unit.create({ data: { name, shortCode } });
  res.status(201).json(new ApiResponse(201, unit, 'Unit created'));
});
