import { z } from 'zod';

export const createExpenseSchema = z.object({
  body: z.object({
    category: z.string().min(2),
    amount: z.number().positive(),
    expenseDate: z.coerce.date().default(() => new Date()),
    note: z.string().optional(),
  }),
});

export const listExpensesSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    category: z.string().optional(),
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
  }),
});
