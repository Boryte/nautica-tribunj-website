"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateSessionBinding = exports.getSessionById = exports.invalidateSession = exports.createSession = exports.authenticateAdmin = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const node_crypto_1 = __importDefault(require("node:crypto"));
const config_1 = require("../config");
const db_1 = require("../db");
const admin_login_security_service_1 = require("./admin-login-security-service");
const errors_1 = require("../utils/errors");
const time_1 = require("../utils/time");
const addHours = (hours) => new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
const authenticateAdmin = ({ email, password, ipAddress, deviceId, }) => {
    const admin = db_1.db.prepare('SELECT * FROM admins WHERE email = ?').get(email);
    if (!admin) {
        (0, admin_login_security_service_1.recordLoginFailure)({ email, ipAddress, deviceId });
        throw new errors_1.AppError(401, 'INVALID_CREDENTIALS', 'Invalid credentials');
    }
    if (admin.locked_until && new Date(admin.locked_until) > new Date()) {
        throw new errors_1.AppError(429, 'ACCOUNT_LOCKED', 'Account temporarily locked');
    }
    if (!bcryptjs_1.default.compareSync(password, admin.password_hash)) {
        (0, admin_login_security_service_1.recordLoginFailure)({ email, ipAddress, deviceId });
        const failedAttempts = admin.failed_attempts + 1;
        db_1.db.prepare(`UPDATE admins
       SET failed_attempts = ?, locked_until = ?, updated_at = ?
       WHERE id = ?`).run(failedAttempts, failedAttempts >= 5 ? addHours(1) : null, (0, time_1.nowIso)(), admin.id);
        throw new errors_1.AppError(401, 'INVALID_CREDENTIALS', 'Invalid credentials');
    }
    db_1.db.prepare(`UPDATE admins
     SET failed_attempts = 0, locked_until = NULL, last_login_at = ?, updated_at = ?
     WHERE id = ?`).run((0, time_1.nowIso)(), (0, time_1.nowIso)(), admin.id);
    (0, admin_login_security_service_1.clearLoginFailures)({ email, ipAddress, deviceId });
    return {
        id: admin.id,
        email: admin.email,
        displayName: admin.display_name,
        role: admin.role,
    };
};
exports.authenticateAdmin = authenticateAdmin;
const createSession = (adminId, ipAddress, userAgent) => {
    const sessionId = node_crypto_1.default.randomUUID();
    const csrfToken = node_crypto_1.default.randomBytes(24).toString('hex');
    const expiresAt = addHours(config_1.env.SESSION_TTL_HOURS);
    db_1.db.prepare(`INSERT INTO sessions (id, admin_id, csrf_token, expires_at, created_at, last_seen_at, user_agent, ip_address)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(sessionId, adminId, csrfToken, expiresAt, (0, time_1.nowIso)(), (0, time_1.nowIso)(), userAgent ?? null, ipAddress ?? null);
    return { sessionId, csrfToken, expiresAt };
};
exports.createSession = createSession;
const invalidateSession = (sessionId) => {
    db_1.db.prepare('DELETE FROM sessions WHERE id = ?').run(sessionId);
};
exports.invalidateSession = invalidateSession;
const getSessionById = (sessionId) => {
    if (!sessionId)
        return { authenticated: false, csrfToken: null, user: null };
    const session = db_1.db.prepare(`SELECT sessions.id, sessions.csrf_token as csrfToken, sessions.expires_at as expiresAt, sessions.user_agent as userAgent, admins.id as adminId, admins.email, admins.role, admins.display_name as displayName
     FROM sessions
     JOIN admins ON admins.id = sessions.admin_id
     WHERE sessions.id = ?`).get(sessionId);
    if (!session || new Date(session.expiresAt) <= new Date()) {
        if (session)
            (0, exports.invalidateSession)(session.id);
        return { authenticated: false, csrfToken: null, user: null };
    }
    db_1.db.prepare('UPDATE sessions SET last_seen_at = ? WHERE id = ?').run((0, time_1.nowIso)(), session.id);
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
exports.getSessionById = getSessionById;
const validateSessionBinding = (sessionId, currentUserAgent) => {
    if (!config_1.isProduction || !currentUserAgent)
        return true;
    const session = db_1.db.prepare('SELECT user_agent as userAgent FROM sessions WHERE id = ?').get(sessionId);
    if (!session?.userAgent)
        return true;
    if (session.userAgent === currentUserAgent)
        return true;
    (0, exports.invalidateSession)(sessionId);
    return false;
};
exports.validateSessionBinding = validateSessionBinding;
