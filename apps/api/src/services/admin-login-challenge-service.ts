import crypto from 'node:crypto';
import type { AdminLoginChallengeDTO } from '../../../../packages/shared/src';
import { env } from '../config';
import { db } from '../db';
import { isAdminTwoFactorEnabled } from './admin-2fa-service';
import { AppError } from '../utils/errors';

const hashValue = (value: string) => crypto.createHash('sha256').update(value).digest('hex');
const reverseText = (value: string) => value.split('').reverse().join('');
const addMinutes = (minutes: number) => new Date(Date.now() + minutes * 60 * 1000).toISOString();
const nowIso = () => new Date().toISOString();

const buildChallengeCode = () => crypto.randomBytes(3).toString('hex').toUpperCase();
const buildUserAgentHash = (userAgent?: string | null) => (userAgent ? hashValue(userAgent) : null);

export const purgeExpiredAdminLoginChallenges = () => {
  db.prepare(
    `DELETE FROM admin_login_challenges
     WHERE expires_at <= ? OR solved_at IS NOT NULL OR attempts >= max_attempts`
  ).run(nowIso());
};

export const createAdminLoginChallenge = (ipAddress?: string | null, userAgent?: string | null): AdminLoginChallengeDTO => {
  purgeExpiredAdminLoginChallenges();

  const challengeId = crypto.randomUUID();
  const code = buildChallengeCode();
  const expectedAnswer = reverseText(code);
  const expiresAt = addMinutes(env.ADMIN_LOGIN_CHALLENGE_TTL_MINUTES);
  const prompt = `Type this code backwards: ${code}`;

  db.prepare(
    `INSERT INTO admin_login_challenges (id, prompt, expected_hash, ip_address, user_agent_hash, expires_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(
    challengeId,
    prompt,
    hashValue(expectedAnswer),
    ipAddress?.trim() || null,
    buildUserAgentHash(userAgent),
    expiresAt,
    nowIso(),
  );

  return {
    mode: 'builtin',
    challengeId,
    prompt,
    expiresAt,
    requiresTwoFactor: isAdminTwoFactorEnabled(),
  };
};

export const verifyAdminLoginChallenge = ({
  challengeId,
  answer,
  ipAddress,
  userAgent,
}: {
  challengeId: string;
  answer: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}) => {
  purgeExpiredAdminLoginChallenges();

  const challenge = db.prepare(
    `SELECT id, expected_hash, ip_address, user_agent_hash, attempts, max_attempts, expires_at, solved_at
     FROM admin_login_challenges
     WHERE id = ?`
  ).get(challengeId) as
    | {
        id: string;
        expected_hash: string;
        ip_address: string | null;
        user_agent_hash: string | null;
        attempts: number;
        max_attempts: number;
        expires_at: string;
        solved_at: string | null;
      }
    | undefined;

  if (!challenge || challenge.solved_at || new Date(challenge.expires_at) <= new Date()) {
    throw new AppError(400, 'LOGIN_CHALLENGE_EXPIRED', 'Verification challenge expired. Request a new one.');
  }

  const incomingIp = ipAddress?.trim() || null;
  const incomingUserAgentHash = buildUserAgentHash(userAgent);
  if (challenge.ip_address !== incomingIp || challenge.user_agent_hash !== incomingUserAgentHash) {
    throw new AppError(400, 'LOGIN_CHALLENGE_INVALID', 'Verification challenge is not valid for this device.');
  }

  if (challenge.attempts >= challenge.max_attempts) {
    throw new AppError(429, 'LOGIN_CHALLENGE_BLOCKED', 'Verification challenge exhausted. Request a new one.');
  }

  const normalizedAnswer = answer.trim().toUpperCase();
  const matches = hashValue(normalizedAnswer) === challenge.expected_hash;

  db.prepare(
    `UPDATE admin_login_challenges
     SET attempts = attempts + 1,
         solved_at = CASE WHEN ? THEN ? ELSE solved_at END
     WHERE id = ?`
  ).run(matches ? 1 : 0, matches ? nowIso() : null, challenge.id);

  if (!matches) {
    throw new AppError(400, 'LOGIN_CHALLENGE_INVALID', 'Verification answer is incorrect.');
  }
};
