// src/models/user.model.ts
import { z } from 'zod';

export const updateUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  avatar: z.string().url().optional(),
  lgpdConsent: z.boolean().optional(),
});

export const userQuerySchema = z.object({
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('20'),
  isActive: z
    .string()
    .transform((v) => v === 'true')
    .optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UserQueryInput = z.infer<typeof userQuerySchema>;
