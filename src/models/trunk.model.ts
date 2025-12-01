// src/models/trunk.model.ts
import { z } from 'zod';

export const createTrunkSchema = z.object({
  name: z.string().min(1).max(100),
  sipUri: z.string().regex(/^sip:.*@.*/, 'SIP URI deve estar no formato sip:username@domain'),
  sipUsername: z.string().min(1),
  sipPassword: z.string().min(6),
  provider: z.string().optional(),
  isPrimary: z.boolean().default(false),
  priority: z.number().int().min(0).max(100).default(0),
  maxChannels: z.number().int().min(1).max(100).default(5),
});

export const updateTrunkSchema = createTrunkSchema.partial().extend({
  isActive: z.boolean().optional(),
  lastTestedAt: z.string().datetime().optional(),
});

export const testTrunkSchema = z.object({
  testNumber: z
    .string()
    .regex(/^\+?55\d{10,11}$/)
    .optional()
    .default('+5511999999999'),
});

export type CreateTrunkInput = z.infer<typeof createTrunkSchema>;
export type UpdateTrunkInput = z.infer<typeof updateTrunkSchema>;
export type TestTrunkInput = z.infer<typeof testTrunkSchema>;
