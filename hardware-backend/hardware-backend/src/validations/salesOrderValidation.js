import { z } from 'zod';

const saleItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().positive(),
  unitPrice: z.number().nonnegative(),
  discountAmount: z.number().nonnegative().default(0),
  taxAmount: z.number().nonnegative().default(0),
});

export const createSaleSchema = z.object({
  body: z.object({
    customerId: z.string().uuid().optional(),
    items: z.array(saleItemSchema).min(1, 'At least one item is required'),
    discountAmount: z.number().nonnegative().default(0),
    paidAmount: z.number().nonnegative().default(0),
    paymentMode: z.enum(['CASH', 'CREDIT', 'PARTIAL', 'CARD', 'BANK_TRANSFER', 'MOBILE_WALLET']).default('CASH'),
    notes: z.string().optional(),
  }),
});

export const listSalesSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(500).default(20),
    customerId: z.string().uuid().optional(),
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
  }),
});