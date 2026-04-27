import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import type { AdminSessionDTO } from '../../../../packages/shared/src';
import { env, isProduction } from '../config';
import { db } from '../db';
import { clearLoginFailures, recordLoginFailure } from './admin-login-security-service';
import { AppError } from '../utils/errors';
import { nowIso } from '../utils/time';

const addHours = (hours: number) => new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();

export const authenticateAdmin = ({
  email,
  password,
  ipAddress,
  deviceId,
}: {
  email: string;
  password: string;
  ipAddress?: string | null;
  deviceId?: string | null;
}) => {
  const admin = db.prepare('SELECT * FROM admins WHERE email = ?').get(email) as
    | {
        id: number;
        email: string;
        password_hash: string;
        failed_attempts: number;
        locked_until: string | null;
        display_name: string;
        role: string;
      }
    | undefined;

  if (!admin) {
    recordLoginFailure({ email, ipAddress, deviceId });
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid credentials');
  }
  if (admin.locked_until && new Date(admin.locked_until) > new Date()) {
    throw new AppError(429, 'ACCOUNT_LOCKED', 'Account temporarily locked');
  }

  if (!bcrypt.compareSync(password, admin.password_hash)) {
    recordLoginFailure({ email, ipAddress, deviceId });
    const failedAttempts = admin.failed_attempts + 1;
    db.prepare(
      `UPDATE admins
       SET failed_attempts = ?, locked_until = ?, updated_at = ?
       WHERE id = ?`
    ).run(failedAttempts, failedAttempts >= 5 ? addHours(1) : null, nowIso(), admin.id);
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid credentials');
  }

  db.prepare(
    `UPDATE admins
     SET failed_attempts = 0, locked_until = NULL, last_login_at = ?, updated_at = ?
     WHERE id = ?`
  ).run(nowIso(), nowIso(), admin.id);
  clearLoginFailures({ email, ipAddress, deviceId });

  return {
    id: admin.id,
    email: admin.email,
    displayName: admin.display_name,
    role: admin.role,
  };
};

export const createSession = (adminId: number, ipAddress?: string, userAgent?: string) => {
  const sessionId = crypto.randomUUID();
  const csrfToken = crypto.randomBytes(24).toString('hex');
  const expiresAt = addHours(env.SESSION_TTL_HOURS);

  db.prepare(
    `INSERT INTO sessions (id, admin_id, csrf_token, expires_at, created_at, last_seen_at, user_agent, ip_address)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(sessionId, adminId, csrfToken, expiresAt, nowIso(), nowIso(), userAgent ?? null, ipAddress ?? null);

  return { sessionId, csrfToken, expiresAt };
};

export const invalidateSession = (sessionId: string) => {
  db.prepare('DELETE FROM sessions WHERE id = ?').run(sessionId);
};

export const getSessionById = (sessionId?: string | null): AdminSessionDTO => {
  if (!sessionId) return { authenticated: false, csrfToken: null, user: null };

  const session = db.prepare(
    `SELECT sessions.id, sessions.csrf_token as csrfToken, sessions.expires_at as expiresAt, sessions.user_agent as userAgent, admins.id as adminId, admins.email, admins.role, admins.display_name as displayName
     FROM sessions
     JOIN admins ON admins.id = sessions.admin_id
     WHERE sessions.id = ?`
  ).get(sessionId) as
    | {
        id: string;
        csrfToken: string;
        expiresAt: string;
        userAgent: string | null;
        adminId: number;
        email: string;
        role: string;
        displayName: string;
      }
    | undefined;

  if (!session || new Date(session.expiresAt) <= new Date()) {
    if (session) invalidateSession(session.id);
    return { authenticated: false, csrfToken: null, user: null };
  }

  db.prepare('UPDATE sessions SET last_seen_at = ? WHERE id = ?').run(nowIso(), session.id);

  return {
    authenticated: true,
    csrfToken: session.csrfToken,
    user: {
      id: session.adminId,
      email: session.email,
      role: session.role,
      displayName: session.displayName,
    },
  };
};

export const validateSessionBinding = (sessionId: string, currentUserAgent?: string | null) => {
  if (!isProduction || !currentUserAgent) return true;

  const session = db.prepare('SELECT user_agent as userAgent FROM sessions WHERE id = ?').get(sessionId) as
    | { userAgent: string | null }
    | undefined;

  if (!session?.userAgent) return true;
  if (session.userAgent === currentUserAgent) return true;

  invalidateSession(sessionId);
  return false;
};
