"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isProduction = exports.env = void 0;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const zod_1 = require("zod");
const src_1 = require("../../../packages/shared/src");
const parseEnvFile = (filePath) => {
    if (!node_fs_1.default.existsSync(filePath))
        return {};
    return Object.fromEntries(node_fs_1.default
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
    }));
};
const rootDir = process.cwd();
const mode = process.env.NODE_ENV?.trim() || 'development';
const booleanFromEnv = zod_1.z
    .union([zod_1.z.boolean(), zod_1.z.string(), zod_1.z.number()])
    .transform((value, context) => {
    if (typeof value === 'boolean')
        return value;
    if (typeof value === 'number')
        return value !== 0;
    const normalized = value.trim().toLowerCase();
    if (['1', 'true', 'yes', 'on'].includes(normalized))
        return true;
    if (['0', 'false', 'no', 'off', ''].includes(normalized))
        return false;
    context.addIssue({
        code: zod_1.z.ZodIssueCode.custom,
        message: 'Expected a boolean-like environment value',
    });
    return zod_1.z.NEVER;
});
const optionalTrimmedString = zod_1.z.preprocess((value) => {
    if (typeof value !== 'string')
        return value;
    const trimmed = value.trim();
    return trimmed.length ? trimmed : undefined;
}, zod_1.z.string().optional());
const fileEnv = {
    ...parseEnvFile(node_path_1.default.resolve(rootDir, '.env')),
    ...parseEnvFile(node_path_1.default.resolve(rootDir, '.env.local')),
    ...parseEnvFile(node_path_1.default.resolve(rootDir, `.env.${mode}`)),
    ...parseEnvFile(node_path_1.default.resolve(rootDir, `.env.${mode}.local`)),
    ...process.env,
};
const envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(['development', 'test', 'production']).default('development'),
    PORT: zod_1.z.coerce.number().int().min(1000).max(65535).default(8787),
    TRUST_PROXY: zod_1.z.union([zod_1.z.literal('loopback'), zod_1.z.literal('linklocal'), zod_1.z.literal('uniquelocal'), zod_1.z.coerce.number().int().min(0).max(5)]).default(1),
    FRONTEND_ORIGIN: zod_1.z.string().url().default('http://localhost:8080'),
    DATABASE_PATH: zod_1.z.string().default(node_path_1.default.resolve(process.cwd(), 'db', 'nautica.sqlite')),
    MEDIA_UPLOAD_DIR: zod_1.z.string().default(node_path_1.default.resolve(process.cwd(), 'public', 'uploads')),
    MEDIA_MAX_FILE_SIZE_MB: zod_1.z.coerce.number().int().min(1).max(20).default(8),
    SESSION_COOKIE_NAME: zod_1.z.string().default('nautica.sid'),
    SESSION_TTL_HOURS: zod_1.z.coerce.number().int().min(1).max(336).default(24),
    ENFORCE_HTTPS: booleanFromEnv.default(mode === 'production'),
    ADMIN_BOOTSTRAP_EMAIL: zod_1.z.string().email().optional(),
    ADMIN_BOOTSTRAP_PASSWORD: zod_1.z.string().min(12).optional(),
    ADMIN_LOGIN_WINDOW_MINUTES: zod_1.z.coerce.number().int().min(5).max(240).default(30),
    ADMIN_LOGIN_LOCKOUT_MINUTES: zod_1.z.coerce.number().int().min(5).max(1440).default(60),
    ADMIN_LOGIN_MAX_ATTEMPTS_PER_IP: zod_1.z.coerce.number().int().min(3).max(30).default(8),
    ADMIN_LOGIN_MAX_ATTEMPTS_PER_EMAIL: zod_1.z.coerce.number().int().min(3).max(20).default(5),
    ADMIN_LOGIN_MAX_ATTEMPTS_PER_DEVICE: zod_1.z.coerce.number().int().min(3).max(20).default(6),
    ADMIN_LOGIN_MAX_ATTEMPTS_PER_COMBO: zod_1.z.coerce.number().int().min(2).max(12).default(4),
    ADMIN_LOGIN_CHALLENGE_TTL_MINUTES: zod_1.z.coerce.number().int().min(1).max(30).default(5),
    ADMIN_2FA_ENABLED: booleanFromEnv.default(false),
    ADMIN_2FA_SECRET: optionalTrimmedString,
    ADMIN_2FA_WINDOW: zod_1.z.coerce.number().int().min(0).max(3).default(1),
    ENABLE_SEED_CONTENT: booleanFromEnv.default(true),
    BUSINESS_TIMEZONE: zod_1.z.string().default(src_1.BUSINESS_TIMEZONE),
    SMTP_FROM: zod_1.z.string().email().default('no-reply@nautica.hr'),
    NOTIFICATION_PROVIDER: zod_1.z.enum(['console', 'mock']).default('console'),
    INSTAGRAM_PROFILE_URL: zod_1.z.string().url().default('https://www.instagram.com/nautica_tribunj/'),
    FACEBOOK_PAGE_URL: zod_1.z.string().url().default('https://www.facebook.com/nauticatribunj'),
    INSTAGRAM_GRAPH_ACCESS_TOKEN: zod_1.z.string().optional(),
    INSTAGRAM_USER_ID: zod_1.z.string().optional(),
    INSTAGRAM_FEED_LIMIT: zod_1.z.coerce.number().int().min(1).max(12).default(6),
    SOCIAL_FEED_CACHE_TTL_SECONDS: zod_1.z.coerce.number().int().min(60).max(3600).default(300),
}).superRefine((value, context) => {
    if (value.ADMIN_2FA_ENABLED && !value.ADMIN_2FA_SECRET) {
        context.addIssue({
            code: zod_1.z.ZodIssueCode.custom,
            path: ['ADMIN_2FA_SECRET'],
            message: 'ADMIN_2FA_SECRET is required when ADMIN_2FA_ENABLED=true',
        });
    }
});
exports.env = envSchema.parse(fileEnv);
exports.isProduction = exports.env.NODE_ENV === 'production';
