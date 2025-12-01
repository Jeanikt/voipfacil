import { z } from 'zod';

export const initiateCallSchema = z.object({
  to: z.string().regex(/^\+?55\d{10,11}$/),
  from: z
    .string()
    .regex(/^\+?55\d{10,11}$/)
    .optional(),
  trunkId: z.string().uuid().optional(),
  recordCall: z.boolean().default(true),
  enableTranscription: z.boolean().default(true),
  enableSentimentAnalysis: z.boolean().default(false),
  script: z.string().max(5000).optional(),
  webhookUrl: z.string().url().optional(),
});

export type InitiateCallInput = z.infer<typeof initiateCallSchema>;
