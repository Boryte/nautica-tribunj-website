import type { NextFunction, Request, Response } from 'express';
import { env } from '../config';
import { getSessionById, validateSessionBinding } from '../services/auth-service';
import { AppError } from '../utils/errors';

const isTrustedInternalAddress = (value?: string | null) => {
  const normalized = value?.trim();
  if (!normalized) return false;

  return (
    normalized === '::1' ||
    normalized === '127.0.0.1' ||
    normalized === '::ffff:127.0.0.1' ||
    normalized.startsWith('10.') ||
    normalized.startsWith('192.168.') ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(normalized)
  );
};

export const loadAdminSession = (request: Request, _response: Response, next: NextFunction) => {
  const sessionId = request.cookies?.[env.SESSION_COOKIE_NAME];
  if (sessionId && !validateSessionBinding(sessionId, request.header('user-agent'))) {
    request.adminSession = { authenticated: false, csrfToken: null, user: null };
    return next();
  }
  request.adminSession = getSessionById(sessionId);
  next();
};

export const requireAdmin = (request: Request, _response: Response, next: NextFunction) => {
  if (!request.adminSession?.authenticated || !request.adminSession.user) {
    return next(new AppError(401, 'UNAUTHORIZED', 'Admin authentication required'));
  }
  return next();
};

export const requireSecureTransport = (request: Request, _response: Response, next: NextFunction) => {
  if (!env.ENFORCE_HTTPS) return next();
  if (request.secure || isTrustedInternalAddress(request.ip)) return next();

  return next(new AppError(426, 'HTTPS_REQUIRED', 'HTTPS is required for API access'));
};

export const requireCsrf = (request: Request, _response: Response, next: NextFunction) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method) || !request.adminSession?.authenticated) {
    return next();
  }

  const headerToken = request.header('x-csrf-token');
  if (!headerToken || headerToken !== request.adminSession.csrfToken) {
    return next(new AppError(403, 'CSRF_MISMATCH', 'Invalid CSRF token'));
  }

  return next();
};
