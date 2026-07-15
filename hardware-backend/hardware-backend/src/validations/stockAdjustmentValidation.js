import { z } from 'zod';

export const createStockAdjustmentSchema = z.object({
  body: z.object({
    productId: z.string().uuid(),
    type: z.enum(['INCREASE', 'DECREASE']),
    quantity: z.number().positive(),
    reason: z.string().min(5, 'A reason of at least 5 characters is required for every manual adjustment'),
  }),
});

export const listStockAdjustmentsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    productId: z.string().uuid().optional(),
  }),
});
