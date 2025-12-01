// src/models/call.model.ts
import { z } from 'zod';

export const initiateCallSchema = z.object({
  to: z.string().regex(/^\+?55\d{10,11}$/, 'Número deve ser no formato brasileiro (+55)'),
  from: z
    .string()
    .regex(/^\+?55\d{10,11}$/, 'Número deve ser no formato brasileiro (+55)')
    .optional(),
  trunkId: z.string().uuid().optional(),
  recordCall: z.boolean().default(true),
  enableTranscription: z.boolean().default(false),
  enableSentimentAnalysis: z.boolean().default(false),
  script: z.string().max(5000).optional(),
  webhookUrl: z.string().url().optional(),
  metadata: z.record(z.any()).optional(),
});

export const updateCallSchema = z.object({
  status: z
    .enum([
      'INITIATED',
      'RINGING',
      'ANSWERED',
      'COMPLETED',
      'FAILED',
      'BUSY',
      'NO_ANSWER',
      'CANCELLED',
    ])
    .optional(),
  duration: z.number().int().positive().optional(),
  billableDuration: z.number().int().positive().optional(),
  recordingUrl: z.string().url().optional(),
  transcription: z.string().optional(),
  sentiment: z.string().optional(),
  sentimentScore: z.number().min(0).max(1).optional(),
  cost: z.number().min(0).optional(),
  errorMessage: z.string().optional(),
  answeredAt: z.string().datetime().optional(),
  completedAt: z.string().datetime().optional(),
});

export const callQuerySchema = z.object({
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('20'),
  status: z
    .enum([
      'INITIATED',
      'RINGING',
      'ANSWERED',
      'COMPLETED',
      'FAILED',
      'BUSY',
      'NO_ANSWER',
      'CANCELLED',
    ])
    .optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  trunkId: z.string().uuid().optional(),
});

export type InitiateCallInput = z.infer<typeof initiateCallSchema>;
export type UpdateCallInput = z.infer<typeof updateCallSchema>;
export type CallQueryInput = z.infer<typeof callQuerySchema>;
