import { z } from 'zod';

export const createCustomerSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    phone: z.string().optional(),
    email: z.string().email().optional(),
    address: z.string().optional(),
    creditLimit: z.number().nonnegative().default(0),
    openingBalance: z.number().nonnegative().default(0),
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