import { z } from 'zod';

export const providerRecommendationSchema = z.object({
  maxPrice: z
    .string()
    .regex(/^\d+(\.\d+)?$/)
    .transform(Number)
    .optional(),
  minChannels: z.string().regex(/^\d+$/).transform(Number).optional(),
  provider: z.string().optional(),
  sortBy: z.enum(['price', 'channels', 'rating']).default('price'),
});

export type ProviderRecommendationInput = z.infer<typeof providerRecommendationSchema>;
