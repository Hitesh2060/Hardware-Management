import { z } from 'zod';

export const createCustomerSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    phone: z.string().optional().nullable(),
    email: z.string().email('Invalid email').optional().nullable(),
    address: z.string().optional().nullable(),
    creditLimit: z.union([
      z.number().nonnegative().default(0),
      z.string().transform((val) => parseFloat(val) || 0),
    ]).default(0),
    openingBalance: z.union([
      z.number().nonnegative().default(0),
      z.string().transform((val) => parseFloat(val) || 0),
    ]).default(0),
  }),
});

export const updateCustomerSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: createCustomerSchema.shape.body.partial(),
});

export const listCustomersSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(500).default(20),
    search: z.string().optional(),
  }),
});