import { z } from 'zod';

const paymentMethodEnum = z.enum(['CASH', 'CARD', 'BANK_TRANSFER', 'MOBILE_WALLET', 'CHEQUE']);

export const recordCustomerPaymentSchema = z.object({
  body: z.object({
    customerId: z.string().uuid(),
    saleId: z.string().uuid().optional(),
    amount: z.number().positive(),
    method: paymentMethodEnum,
    note: z.string().optional(),
  }),
});

export const recordSupplierPaymentSchema = z.object({
  body: z.object({
    supplierId: z.string().uuid(),
    purchaseId: z.string().uuid().optional(),
    amount: z.number().positive(),
    method: paymentMethodEnum,
    note: z.string().optional(),
  }),
});

export const listPaymentsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    direction: z.enum(['IN', 'OUT']).optional(),
    customerId: z.string().uuid().optional(),
    supplierId: z.string().uuid().optional(),
  }),
});
