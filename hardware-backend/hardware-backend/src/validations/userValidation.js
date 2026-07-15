import { z } from 'zod';

export const listUsersSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  }),
});

export const updateUserRoleSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({ roleId: z.string().uuid() }),
});

export const setUserActiveSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({ isActive: z.boolean() }),
});

export const adminResetPasswordSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({ newPassword: z.string().min(8) }),
});
