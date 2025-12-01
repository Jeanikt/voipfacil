import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.string().transform(Number).default("3000"),
  APP_URL: z.string().url(),

  DATABASE_URL: z.string().url(),

  REDIS_URL: z.string().url(),
  REDIS_PASSWORD: z.string().optional(),

  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default("7d"),

  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  GOOGLE_CALLBACK_URL: z.string().url(),

  SESSION_SECRET: z.string().min(32),

  ASTERISK_HOST: z.string().default("localhost"),
  ASTERISK_PORT: z.string().transform(Number).default("5038"),
  ASTERISK_USERNAME: z.string().default("admin"),
  ASTERISK_PASSWORD: z.string().default("password"),
  ASTERISK_CONTEXT: z.string().default("from-voipfacil"),
  ASTERISK_ENABLED: z.string().default("false"),

  JANUS_HTTP_URL: z.string().url().default("http://localhost:8088/janus"),
  JANUS_WS_URL: z.string().default("ws://localhost:8188"),
  JANUS_ADMIN_SECRET: z.string().default("janusoverlord"),
  JANUS_ENABLED: z.string().default("false"),

  WHISPER_API_KEY: z.string().optional(),
  HUGGINGFACE_API_KEY: z.string().optional(),

  PAGARME_API_KEY: z.string().optional(),
  PAGARME_ENCRYPTION_KEY: z.string().optional(),

  SENTRY_DSN: z.string().url().optional(),

  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default("900000"),
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default("100"),

  FALLBACK_TRUNKS: z.string().optional(),

  LOG_LEVEL: z.enum(["error", "warn", "info", "debug"]).default("info"),
  LOG_MAX_FILES: z.string().default("14d"),

  USE_MOCKS: z.string().default("true"),
});

export const env = envSchema.parse(process.env);

export const isProduction = env.NODE_ENV === "production";
export const isDevelopment = env.NODE_ENV === "development";
export const isTest = env.NODE_ENV === "test";
