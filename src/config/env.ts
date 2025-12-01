// src/config/env.ts
import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  // App
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3000'),
  APP_URL: z.string().url().default('http://localhost:3000'),

  // Database
  DATABASE_URL: z.string().url(),

  // Redis
  REDIS_URL: z.string().url().default('redis://localhost:6379'),
  REDIS_PASSWORD: z.string().optional(),

  // Auth
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('7d'),

  // Google OAuth
  GOOGLE_CLIENT_ID: z.string().min(1).optional(),
  GOOGLE_CLIENT_SECRET: z.string().min(1).optional(),
  GOOGLE_CALLBACK_URL: z.string().url().optional(),

  // Session
  SESSION_SECRET: z.string().min(32),

  // Asterisk
  ASTERISK_HOST: z.string().default('localhost'),
  ASTERISK_PORT: z.string().transform(Number).default('5038'),
  ASTERISK_USERNAME: z.string().default('admin'),
  ASTERISK_PASSWORD: z.string().default('admin'),
  ASTERISK_CONTEXT: z.string().default('from-voipfacil'),
  ASTERISK_ENABLED: z
    .string()
    .transform((v) => v === 'true')
    .default('false'),

  // Janus
  JANUS_HTTP_URL: z.string().url().default('http://localhost:8088/janus'),
  JANUS_WS_URL: z.string().default('ws://localhost:8188'),
  JANUS_ADMIN_SECRET: z.string().default('janusoverlord'),
  JANUS_ENABLED: z
    .string()
    .transform((v) => v === 'true')
    .default('false'),

  // AI Services
  OPENAI_API_KEY: z.string().optional(),
  HUGGINGFACE_API_KEY: z.string().optional(),

  // Payment
  PAGARME_API_KEY: z.string().optional(),
  PAGARME_ENCRYPTION_KEY: z.string().optional(),

  // Monitoring
  SENTRY_DSN: z.preprocess((v) => (v === '' ? undefined : v), z.string().url().optional()),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('900000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default('100'),

  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  LOG_MAX_FILES: z.string().default('14d'),

  // Features
  ENABLE_AI_FEATURES: z
    .string()
    .transform((v) => v === 'true')
    .default('false'),
  ENABLE_BILLING: z
    .string()
    .transform((v) => v === 'true')
    .default('false'),

  // Mocks
  USE_MOCKS: z
    .string()
    .transform((v) => v === 'true')
    .default('false'),
});

export const env = envSchema.parse(process.env);
export const isProduction = env.NODE_ENV === 'production';
export const isDevelopment = env.NODE_ENV === 'development';
export const isTest = env.NODE_ENV === 'test';
