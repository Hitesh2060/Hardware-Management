import { z } from 'zod';

const purchaseItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().positive(),
  unitCost: z.number().nonnegative(),
  discountAmount: z.number().nonnegative().default(0),
  taxAmount: z.number().nonnegative().default(0),
});

export const createPurchaseSchema = z.object({
  body: z.object({
    supplierId: z.string().uuid(),
    items: z.array(purchaseItemSchema).min(1, 'At least one item is required'),
    discountAmount: z.number().nonnegative().default(0),
    transportCharge: z.number().nonnegative().default(0),
    paidAmount: z.number().nonnegative().default(0),
    notes: z.string().optional(),
  }),
});

export const listPurchasesSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(500).default(20),
    supplierId: z.string().uuid().optional(),
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
  }),
});