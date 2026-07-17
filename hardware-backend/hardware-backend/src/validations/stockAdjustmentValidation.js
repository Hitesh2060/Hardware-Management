import { z } from 'zod';

export const createStockAdjustmentSchema = z.object({
  body: z.object({
    productId: z.string().uuid('Invalid product ID'),
    type: z.enum(['INCREASE', 'DECREASE'], {
      errorMap: () => ({ message: 'Type must be INCREASE or DECREASE' }),
    }),
    quantity: z.number()
      .positive('Quantity must be greater than 0')
      .max(999999, 'Quantity too large'),
    reason: z.string()
      .min(5, 'A reason of at least 5 characters is required for every manual adjustment')
      .max(500, 'Reason too long (max 500 characters)'),
  }),
});

export const listStockAdjustmentsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    productId: z.string().uuid().optional(),
  }),
});

// ✅ Financial Report Schema
export const adjustmentReportSchema = z.object({
  query: z.object({
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
    productId: z.string().uuid().optional(),
  }),
});

// ✅ Financial Summary Schema
export const financialSummarySchema = z.object({
  query: z.object({
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
  }),
});

// ✅ Profit & Loss Schema
export const profitLossSchema = z.object({
  query: z.object({
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
  }),
});