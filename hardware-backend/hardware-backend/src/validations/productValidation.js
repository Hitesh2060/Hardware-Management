import { z } from 'zod';

export const createProductSchema = z.object({
  body: z.object({
    sku: z.string().min(1),
    barcode: z.string().optional(),
    name: z.string().min(2),
    description: z.string().optional(),
    categoryId: z.string().uuid(),
    brandId: z.string().uuid().optional(),
    unitId: z.string().uuid(),
    costPrice: z.number().nonnegative(),
    sellingPrice: z.number().positive(),
    taxPercent: z.number().min(0).max(100).default(0),
    reorderLevel: z.number().int().min(0).default(0),
    openingStock: z.number().min(0).default(0),
  }),
});

export const updateProductSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: createProductSchema.shape.body.partial().omit({ openingStock: true }),
});

export const listProductsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(500).default(20),
    search: z.string().optional(),
    categoryId: z.string().uuid().optional(),
    lowStockOnly: z.coerce.boolean().optional(),
  }),
});