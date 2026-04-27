import crypto from 'node:crypto';
import { env } from '../config';
import { db } from '../db';
import { AppError } from '../utils/errors';
import { nowIso } from '../utils/time';

type GuardScope = 'ip' | 'email' | 'device' | 'combo';

type GuardRow = {
  id: number;
  failed_attempts: number;
  first_failed_at: string | null;
  locked_until: string | null;
};

type LoginGuardContext = {
  email: string;
  ipAddress?: string | null;
  deviceId?: string | null;
};

const LOGIN_RETRY_MESSAGE = 'Too many failed login attempts. Please try again later.';

const hashValue = (value: string) => crypto.createHash('sha256').update(value).digest('hex');
const normalizeEmail = (value: string) => value.trim().toLowerCase();

const buildSubjects = ({ email, ipAddress, deviceId }: LoginGuardContext) => {
  const normalizedEmail = normalizeEmail(email);
  const trimmedIp = ipAddress?.trim() || null;
  const trimmedDevice = deviceId?.trim() || null;

  return [
    trimmedIp ? { scope: 'ip' as const, subjectKey: hashValue(trimmedIp) } : null,
    { scope: 'email' as const, subjectKey: hashValue(normalizedEmail) },
    trimmedDevice ? { scope: 'device' as const, subjectKey: hashValue(trimmedDevice) } : null,
    trimmedIp ? { scope: 'combo' as const, subjectKey: hashValue(`${normalizedEmail}:${trimmedIp}`) } : null,
  ].filter(Boolean) as Array<{ scope: GuardScope; subjectKey: string }>;
};

const getThreshold = (scope: GuardScope) => {
  switch (scope) {
    case 'ip':
      return env.ADMIN_LOGIN_MAX_ATTEMPTS_PER_IP;
    case 'email':
      return env.ADMIN_LOGIN_MAX_ATTEMPTS_PER_EMAIL;
    case 'device':
      return env.ADMIN_LOGIN_MAX_ATTEMPTS_PER_DEVICE;
    case 'combo':
      return env.ADMIN_LOGIN_MAX_ATTEMPTS_PER_COMBO;
  }
};

const addMinutes = (minutes: number) => new Date(Date.now() + minutes * 60 * 1000).toISOString();

const getGuard = (scope: GuardScope, subjectKey: string) =>
  db
    .prepare(
      `SELECT id, failed_attempts, first_failed_at, locked_until
       FROM admin_login_guards
       WHERE scope = ? AND subject_key = ?`
    )
    .get(scope, subjectKey) as GuardRow | undefined;

const upsertGuard = ({
  scope,
  subjectKey,
  failedAttempts,
  firstFailedAt,
  lockedUntil,
}: {
  scope: GuardScope;
  subjectKey: string;
  failedAttempts: number;
  firstFailedAt: string | null;
  lockedUntil: string | null;
}) => {
  db.prepare(
    `INSERT INTO admin_login_guards (scope, subject_key, failed_attempts, first_failed_at, last_failed_at, locked_until, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(scope, subject_key) DO UPDATE SET
       failed_attempts = excluded.failed_attempts,
       first_failed_at = excluded.first_failed_at,
       last_failed_at = excluded.last_failed_at,
       locked_until = excluded.locked_until,
       updated_at = excluded.updated_at`
  ).run(scope, subjectKey, failedAttempts, firstFailedAt, nowIso(), lockedUntil, nowIso());
};

const clearGuard = (scope: GuardScope, subjectKey: string) => {
  db.prepare(
    `UPDATE admin_login_guards
     SET failed_attempts = 0,
         first_failed_at = NULL,
         last_failed_at = NULL,
         locked_until = NULL,
         last_success_at = ?,
         updated_at = ?
     WHERE scope = ? AND subject_key = ?`
  ).run(nowIso(), nowIso(), scope, subjectKey);
};

const getRemainingSeconds = (lockedUntil: string) =>
  Math.max(1, Math.ceil((new Date(lockedUntil).getTime() - Date.now()) / 1000));

export const assertLoginAllowed = (context: LoginGuardContext) => {
  const matches = buildSubjects(context)
    .map(({ scope, subjectKey }) => ({ scope, row: getGuard(scope, subjectKey) }))
    .filter((entry) => entry.row?.locked_until && new Date(entry.row.locked_until) > new Date()) as Array<{
    scope: GuardScope;
    row: GuardRow & { locked_until: string };
  }>;

  if (!matches.length) return;

  const mostRestrictive = matches.reduce((current, entry) =>
    getRemainingSeconds(entry.row.locked_until) > getRemainingSeconds(current.row.locked_until) ? entry : current
  );

  throw new AppError(429, 'LOGIN_TEMPORARILY_BLOCKED', LOGIN_RETRY_MESSAGE, {
    retryAfterSeconds: getRemainingSeconds(mostRestrictive.row.locked_until),
    blockedBy: mostRestrictive.scope,
  });
};

export const recordLoginFailure = (context: LoginGuardContext) => {
  const windowStart = Date.now() - env.ADMIN_LOGIN_WINDOW_MINUTES * 60 * 1000;

  for (const { scope, subjectKey } of buildSubjects(context)) {
    const current = getGuard(scope, subjectKey);
    const shouldResetWindow =
      !current?.first_failed_at || new Date(current.first_failed_at).getTime() < windowStart;
    const failedAttempts = shouldResetWindow ? 1 : (current?.failed_attempts ?? 0) + 1;
    const firstFailedAt = shouldResetWindow ? nowIso() : current?.first_failed_at ?? nowIso();
    const threshold = getThreshold(scope);
    const lockedUntil = failedAttempts >= threshold ? addMinutes(env.ADMIN_LOGIN_LOCKOUT_MINUTES) : null;

    upsertGuard({
      scope,
      subjectKey,
      failedAttempts,
      firstFailedAt,
      lockedUntil,
    });
  }
};

export const clearLoginFailures = (context: LoginGuardContext) => {
  for (const { scope, subjectKey } of buildSubjects(context)) {
    clearGuard(scope, subjectKey);
  }
};
