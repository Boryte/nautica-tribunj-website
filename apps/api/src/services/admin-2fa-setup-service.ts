import crypto from 'node:crypto';
import QRCode from 'qrcode';
import type { AdminTwoFactorSetupDTO } from '../../../../packages/shared/src';
import { env } from '../config';

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

const encodeBase32 = (buffer: Buffer) => {
  let bits = '';
  for (const byte of buffer) {
    bits += byte.toString(2).padStart(8, '0');
  }

  let output = '';
  for (let index = 0; index < bits.length; index += 5) {
    const chunk = bits.slice(index, index + 5).padEnd(5, '0');
    output += BASE32_ALPHABET[Number.parseInt(chunk, 2)];
  }

  return output;
};

const getTwoFactorIssuer = () => {
  try {
    const origin = new URL(env.FRONTEND_ORIGIN);
    return origin.hostname.replace(/^www\./i, '') || 'Nautica Admin';
  } catch {
    return 'Nautica Admin';
  }
};

const buildAccountLabel = () => env.ADMIN_BOOTSTRAP_EMAIL ?? `admin@${getTwoFactorIssuer()}`;

export const createAdminTwoFactorSetup = async (): Promise<AdminTwoFactorSetupDTO> => {
  const issuer = getTwoFactorIssuer();
  const accountLabel = buildAccountLabel();
  const secret = encodeBase32(crypto.randomBytes(20));
  const otpauthUri = `otpauth://totp/${encodeURIComponent(`${issuer}:${accountLabel}`)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
  const qrCodeDataUrl = await QRCode.toDataURL(otpauthUri, {
    errorCorrectionLevel: 'M',
    margin: 1,
    width: 320,
    color: {
      dark: '#07111A',
      light: '#F6F1E8',
    },
  });

  return {
    issuer,
    accountLabel,
    secret,
    otpauthUri,
    qrCodeDataUrl,
    alreadyEnabled: env.ADMIN_2FA_ENABLED,
  };
};
