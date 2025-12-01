// src/models/provider.model.ts
import { z } from 'zod';

export const providerRecommendationSchema = z.object({
  maxPrice: z.string().transform(Number).optional(),
  minChannels: z.string().transform(Number).optional(),
  provider: z.string().optional(),
  sortBy: z.enum(['price', 'channels', 'rating']).default('price'),
});

export const createProviderSchema = z.object({
  name: z.string().min(1).max(100),
  plan: z.string().min(1).max(100),
  precoMensal: z.number().min(0),
  tarifaFixo: z.number().min(0),
  tarifaMovel: z.number().min(0),
  canais: z.number().int().min(1),
  link: z.string().url(),
  features: z.array(z.string()),
  rating: z.number().min(0).max(5).optional(),
  reviews: z.number().int().min(0).optional(),
});

export type ProviderRecommendationInput = z.infer<typeof providerRecommendationSchema>;
export type CreateProviderInput = z.infer<typeof createProviderSchema>;
