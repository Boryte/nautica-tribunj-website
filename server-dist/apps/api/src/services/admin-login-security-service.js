"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearLoginFailures = exports.recordLoginFailure = exports.assertLoginAllowed = void 0;
const node_crypto_1 = __importDefault(require("node:crypto"));
const config_1 = require("../config");
const db_1 = require("../db");
const errors_1 = require("../utils/errors");
const time_1 = require("../utils/time");
const LOGIN_RETRY_MESSAGE = 'Too many failed login attempts. Please try again later.';
const hashValue = (value) => node_crypto_1.default.createHash('sha256').update(value).digest('hex');
const normalizeEmail = (value) => value.trim().toLowerCase();
const buildSubjects = ({ email, ipAddress, deviceId }) => {
    const normalizedEmail = normalizeEmail(email);
    const trimmedIp = ipAddress?.trim() || null;
    const trimmedDevice = deviceId?.trim() || null;
    return [
        trimmedIp ? { scope: 'ip', subjectKey: hashValue(trimmedIp) } : null,
        { scope: 'email', subjectKey: hashValue(normalizedEmail) },
        trimmedDevice ? { scope: 'device', subjectKey: hashValue(trimmedDevice) } : null,
        trimmedIp ? { scope: 'combo', subjectKey: hashValue(`${normalizedEmail}:${trimmedIp}`) } : null,
    ].filter(Boolean);
};
const getThreshold = (scope) => {
    switch (scope) {
        case 'ip':
            return config_1.env.ADMIN_LOGIN_MAX_ATTEMPTS_PER_IP;
        case 'email':
            return config_1.env.ADMIN_LOGIN_MAX_ATTEMPTS_PER_EMAIL;
        case 'device':
            return config_1.env.ADMIN_LOGIN_MAX_ATTEMPTS_PER_DEVICE;
        case 'combo':
            return config_1.env.ADMIN_LOGIN_MAX_ATTEMPTS_PER_COMBO;
    }
};
const addMinutes = (minutes) => new Date(Date.now() + minutes * 60 * 1000).toISOString();
const getGuard = (scope, subjectKey) => db_1.db
    .prepare(`SELECT id, failed_attempts, first_failed_at, locked_until
       FROM admin_login_guards
       WHERE scope = ? AND subject_key = ?`)
    .get(scope, subjectKey);
const upsertGuard = ({ scope, subjectKey, failedAttempts, firstFailedAt, lockedUntil, }) => {
    db_1.db.prepare(`INSERT INTO admin_login_guards (scope, subject_key, failed_attempts, first_failed_at, last_failed_at, locked_until, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(scope, subject_key) DO UPDATE SET
       failed_attempts = excluded.failed_attempts,
       first_failed_at = excluded.first_failed_at,
       last_failed_at = excluded.last_failed_at,
       locked_until = excluded.locked_until,
       updated_at = excluded.updated_at`).run(scope, subjectKey, failedAttempts, firstFailedAt, (0, time_1.nowIso)(), lockedUntil, (0, time_1.nowIso)());
};
const clearGuard = (scope, subjectKey) => {
    db_1.db.prepare(`UPDATE admin_login_guards
     SET failed_attempts = 0,
         first_failed_at = NULL,
         last_failed_at = NULL,
         locked_until = NULL,
         last_success_at = ?,
         updated_at = ?
     WHERE scope = ? AND subject_key = ?`).run((0, time_1.nowIso)(), (0, time_1.nowIso)(), scope, subjectKey);
};
const getRemainingSeconds = (lockedUntil) => Math.max(1, Math.ceil((new Date(lockedUntil).getTime() - Date.now()) / 1000));
const assertLoginAllowed = (context) => {
    const matches = buildSubjects(context)
        .map(({ scope, subjectKey }) => ({ scope, row: getGuard(scope, subjectKey) }))
        .filter((entry) => entry.row?.locked_until && new Date(entry.row.locked_until) > new Date());
    if (!matches.length)
        return;
    const mostRestrictive = matches.reduce((current, entry) => getRemainingSeconds(entry.row.locked_until) > getRemainingSeconds(current.row.locked_until) ? entry : current);
    throw new errors_1.AppError(429, 'LOGIN_TEMPORARILY_BLOCKED', LOGIN_RETRY_MESSAGE, {
        retryAfterSeconds: getRemainingSeconds(mostRestrictive.row.locked_until),
        blockedBy: mostRestrictive.scope,
    });
};
exports.assertLoginAllowed = assertLoginAllowed;
const recordLoginFailure = (context) => {
    const windowStart = Date.now() - config_1.env.ADMIN_LOGIN_WINDOW_MINUTES * 60 * 1000;
    for (const { scope, subjectKey } of buildSubjects(context)) {
        const current = getGuard(scope, subjectKey);
        const shouldResetWindow = !current?.first_failed_at || new Date(current.first_failed_at).getTime() < windowStart;
        const failedAttempts = shouldResetWindow ? 1 : (current?.failed_attempts ?? 0) + 1;
        const firstFailedAt = shouldResetWindow ? (0, time_1.nowIso)() : current?.first_failed_at ?? (0, time_1.nowIso)();
        const threshold = getThreshold(scope);
        const lockedUntil = failedAttempts >= threshold ? addMinutes(config_1.env.ADMIN_LOGIN_LOCKOUT_MINUTES) : null;
        upsertGuard({
            scope,
            subjectKey,
            failedAttempts,
            firstFailedAt,
            lockedUntil,
        });
    }
};
exports.recordLoginFailure = recordLoginFailure;
const clearLoginFailures = (context) => {
    for (const { scope, subjectKey } of buildSubjects(context)) {
        clearGuard(scope, subjectKey);
    }
};
exports.clearLoginFailures = clearLoginFailures;
