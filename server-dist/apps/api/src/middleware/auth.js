"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireCsrf = exports.requireSecureTransport = exports.requireAdmin = exports.loadAdminSession = void 0;
const config_1 = require("../config");
const auth_service_1 = require("../services/auth-service");
const errors_1 = require("../utils/errors");
const isTrustedInternalAddress = (value) => {
    const normalized = value?.trim();
    if (!normalized)
        return false;
    return (normalized === '::1' ||
        normalized === '127.0.0.1' ||
        normalized === '::ffff:127.0.0.1' ||
        normalized.startsWith('10.') ||
        normalized.startsWith('192.168.') ||
        /^172\.(1[6-9]|2\d|3[0-1])\./.test(normalized));
};
const loadAdminSession = (request, _response, next) => {
    const sessionId = request.cookies?.[config_1.env.SESSION_COOKIE_NAME];
    if (sessionId && !(0, auth_service_1.validateSessionBinding)(sessionId, request.header('user-agent'))) {
        request.adminSession = { authenticated: false, csrfToken: null, user: null };
        return next();
    }
    request.adminSession = (0, auth_service_1.getSessionById)(sessionId);
    next();
};
exports.loadAdminSession = loadAdminSession;
const requireAdmin = (request, _response, next) => {
    if (!request.adminSession?.authenticated || !request.adminSession.user) {
        return next(new errors_1.AppError(401, 'UNAUTHORIZED', 'Admin authentication required'));
    }
    return next();
};
exports.requireAdmin = requireAdmin;
const requireSecureTransport = (request, _response, next) => {
    if (!config_1.env.ENFORCE_HTTPS)
        return next();
    if (request.secure || isTrustedInternalAddress(request.ip))
        return next();
    return next(new errors_1.AppError(426, 'HTTPS_REQUIRED', 'HTTPS is required for API access'));
};
exports.requireSecureTransport = requireSecureTransport;
const requireCsrf = (request, _response, next) => {
    if (['GET', 'HEAD', 'OPTIONS'].includes(request.method) || !request.adminSession?.authenticated) {
        return next();
    }
    const headerToken = request.header('x-csrf-token');
    if (!headerToken || headerToken !== request.adminSession.csrfToken) {
        return next(new errors_1.AppError(403, 'CSRF_MISMATCH', 'Invalid CSRF token'));
    }
    return next();
};
exports.requireCsrf = requireCsrf;
