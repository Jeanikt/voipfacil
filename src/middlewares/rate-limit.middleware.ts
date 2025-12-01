// src/middlewares/rate-limit.middleware.ts
import rateLimit from 'express-rate-limit';
import { env } from '@/config/env';

export const apiLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_REQUESTS,
  message: {
    success: false,
    error: 'Muitas requisições. Tente novamente em alguns minutos.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // máximo 10 requisições por janela
  message: {
    success: false,
    error: 'Muitas tentativas. Tente novamente em 15 minutos.',
  },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // máximo 5 tentativas de login
  message: {
    success: false,
    error: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
  },
});
