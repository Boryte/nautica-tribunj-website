import crypto from 'node:crypto';
import { env } from '../config';
import { AppError } from '../utils/errors';

const TOTP_STEP_SECONDS = 30;
const TOTP_DIGITS = 6;
const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

const decodeBase32 = (value: string) => {
  const normalized = value.toUpperCase().replace(/=+$/g, '').replace(/[\s-]+/g, '');
  let bits = '';

  for (const character of normalized) {
    const index = BASE32_ALPHABET.indexOf(character);
    if (index === -1) {
      throw new AppError(500, 'ADMIN_2FA_CONFIG_INVALID', 'Admin 2FA secret is invalid');
    }
    bits += index.toString(2).padStart(5, '0');
  }

  const bytes = [];
  for (let index = 0; index + 8 <= bits.length; index += 8) {
    bytes.push(Number.parseInt(bits.slice(index, index + 8), 2));
  }

  return Buffer.from(bytes);
};

const getTotpCounterBuffer = (counter: number) => {
  const buffer = Buffer.alloc(8);
  buffer.writeUInt32BE(Math.floor(counter / 0x100000000), 0);
  buffer.writeUInt32BE(counter >>> 0, 4);
  return buffer;
};

const generateTotpCode = (secret: Buffer, offsetSteps = 0) => {
  const counter = Math.floor(Date.now() / (TOTP_STEP_SECONDS * 1000)) + offsetSteps;
  const digest = crypto.createHmac('sha1', secret).update(getTotpCounterBuffer(counter)).digest();
  const offset = digest[digest.length - 1] & 0x0f;
  const binaryCode =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff);

  return String(binaryCode % 10 ** TOTP_DIGITS).padStart(TOTP_DIGITS, '0');
};

const getTotpSecret = () => decodeBase32(env.ADMIN_2FA_SECRET ?? '');

export const isAdminTwoFactorEnabled = () => env.ADMIN_2FA_ENABLED;

export const verifyAdminTwoFactorCode = (value: string | null | undefined) => {
  if (!isAdminTwoFactorEnabled()) return;

  const code = value?.trim();
  if (!code || !/^\d{6}$/.test(code)) {
    throw new AppError(401, 'ADMIN_2FA_REQUIRED', 'Authenticator code is required');
  }

  const secret = getTotpSecret();
  for (let offset = -env.ADMIN_2FA_WINDOW; offset <= env.ADMIN_2FA_WINDOW; offset += 1) {
    if (generateTotpCode(secret, offset) === code) return;
  }

  throw new AppError(401, 'ADMIN_2FA_INVALID', 'Authenticator code is invalid');
};
