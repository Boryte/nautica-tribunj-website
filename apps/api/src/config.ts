import fs from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import { BUSINESS_TIMEZONE } from '../../../packages/shared/src';

const parseEnvFile = (filePath: string) => {
  if (!fs.existsSync(filePath)) return {} as Record<string, string>;

  return Object.fromEntries(
    fs
      .readFileSync(filePath, 'utf8')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#') && line.includes('='))
      .map((line) => {
        const separatorIndex = line.indexOf('=');
        const key = line.slice(0, separatorIndex).trim();
        const rawValue = line.slice(separatorIndex + 1).trim();
        const value = rawValue.replace(/^['"]|['"]$/g, '');
        return [key, value];
      })
  );
};

const rootDir = process.cwd();
const mode = process.env.NODE_ENV?.trim() || 'development';

const booleanFromEnv = z
  .union([z.boolean(), z.string(), z.number()])
  .transform((value, context) => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value !== 0;

    const normalized = value.trim().toLowerCase();
    if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
    if (['0', 'false', 'no', 'off', ''].includes(normalized)) return false;

    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Expected a boolean-like environment value',
    });
    return z.NEVER;
  });

const optionalTrimmedString = z.preprocess((value) => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
}, z.string().optional());

const fileEnv = {
  ...parseEnvFile(path.resolve(rootDir, '.env')),
  ...parseEnvFile(path.resolve(rootDir, '.env.local')),
  ...parseEnvFile(path.resolve(rootDir, `.env.${mode}`)),
  ...parseEnvFile(path.resolve(rootDir, `.env.${mode}.local`)),
  ...process.env,
};

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1000).max(65535).default(8787),
  TRUST_PROXY: z.union([z.literal('loopback'), z.literal('linklocal'), z.literal('uniquelocal'), z.coerce.number().int().min(0).max(5)]).default(1),
  FRONTEND_ORIGIN: z.string().url().default('http://localhost:8080'),
  DATABASE_PATH: z.string().default(path.resolve(process.cwd(), 'db', 'nautica.sqlite')),
  MEDIA_UPLOAD_DIR: z.string().default(path.resolve(process.cwd(), 'public', 'uploads')),
  MEDIA_MAX_FILE_SIZE_MB: z.coerce.number().int().min(1).max(20).default(8),
  SESSION_COOKIE_NAME: z.string().default('nautica.sid'),
  SESSION_TTL_HOURS: z.coerce.number().int().min(1).max(336).default(24),
  ENFORCE_HTTPS: booleanFromEnv.default(mode === 'production'),
  ADMIN_BOOTSTRAP_EMAIL: z.string().email().optional(),
  ADMIN_BOOTSTRAP_PASSWORD: z.string().min(12).optional(),
  ADMIN_LOGIN_WINDOW_MINUTES: z.coerce.number().int().min(5).max(240).default(30),
  ADMIN_LOGIN_LOCKOUT_MINUTES: z.coerce.number().int().min(5).max(1440).default(60),
  ADMIN_LOGIN_MAX_ATTEMPTS_PER_IP: z.coerce.number().int().min(3).max(30).default(8),
  ADMIN_LOGIN_MAX_ATTEMPTS_PER_EMAIL: z.coerce.number().int().min(3).max(20).default(5),
  ADMIN_LOGIN_MAX_ATTEMPTS_PER_DEVICE: z.coerce.number().int().min(3).max(20).default(6),
  ADMIN_LOGIN_MAX_ATTEMPTS_PER_COMBO: z.coerce.number().int().min(2).max(12).default(4),
  ADMIN_LOGIN_CHALLENGE_TTL_MINUTES: z.coerce.number().int().min(1).max(30).default(5),
  ADMIN_2FA_ENABLED: booleanFromEnv.default(false),
  ADMIN_2FA_SECRET: optionalTrimmedString,
  ADMIN_2FA_WINDOW: z.coerce.number().int().min(0).max(3).default(1),
  ENABLE_SEED_CONTENT: booleanFromEnv.default(true),
  BUSINESS_TIMEZONE: z.string().default(BUSINESS_TIMEZONE),
  SMTP_FROM: z.string().email().default('no-reply@nautica.hr'),
  NOTIFICATION_PROVIDER: z.enum(['console', 'mock']).default('console'),
  INSTAGRAM_PROFILE_URL: z.string().url().default('https://www.instagram.com/nautica_tribunj/'),
  FACEBOOK_PAGE_URL: z.string().url().default('https://www.facebook.com/nauticatribunj'),
  INSTAGRAM_GRAPH_ACCESS_TOKEN: z.string().optional(),
  INSTAGRAM_USER_ID: z.string().optional(),
  INSTAGRAM_FEED_LIMIT: z.coerce.number().int().min(1).max(12).default(6),
  SOCIAL_FEED_CACHE_TTL_SECONDS: z.coerce.number().int().min(60).max(3600).default(300),
}).superRefine((value, context) => {
  if (value.ADMIN_2FA_ENABLED && !value.ADMIN_2FA_SECRET) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['ADMIN_2FA_SECRET'],
      message: 'ADMIN_2FA_SECRET is required when ADMIN_2FA_ENABLED=true',
    });
  }
});

export const env = envSchema.parse(fileEnv);
export const isProduction = env.NODE_ENV === 'production';
