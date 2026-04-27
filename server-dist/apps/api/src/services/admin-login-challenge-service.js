"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyAdminLoginChallenge = exports.createAdminLoginChallenge = exports.purgeExpiredAdminLoginChallenges = void 0;
const node_crypto_1 = __importDefault(require("node:crypto"));
const config_1 = require("../config");
const db_1 = require("../db");
const admin_2fa_service_1 = require("./admin-2fa-service");
const errors_1 = require("../utils/errors");
const hashValue = (value) => node_crypto_1.default.createHash('sha256').update(value).digest('hex');
const reverseText = (value) => value.split('').reverse().join('');
const addMinutes = (minutes) => new Date(Date.now() + minutes * 60 * 1000).toISOString();
const nowIso = () => new Date().toISOString();
const buildChallengeCode = () => node_crypto_1.default.randomBytes(3).toString('hex').toUpperCase();
const buildUserAgentHash = (userAgent) => (userAgent ? hashValue(userAgent) : null);
const purgeExpiredAdminLoginChallenges = () => {
    db_1.db.prepare(`DELETE FROM admin_login_challenges
     WHERE expires_at <= ? OR solved_at IS NOT NULL OR attempts >= max_attempts`).run(nowIso());
};
exports.purgeExpiredAdminLoginChallenges = purgeExpiredAdminLoginChallenges;
const createAdminLoginChallenge = (ipAddress, userAgent) => {
    (0, exports.purgeExpiredAdminLoginChallenges)();
    const challengeId = node_crypto_1.default.randomUUID();
    const code = buildChallengeCode();
    const expectedAnswer = reverseText(code);
    const expiresAt = addMinutes(config_1.env.ADMIN_LOGIN_CHALLENGE_TTL_MINUTES);
    const prompt = `Type this code backwards: ${code}`;
    db_1.db.prepare(`INSERT INTO admin_login_challenges (id, prompt, expected_hash, ip_address, user_agent_hash, expires_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`).run(challengeId, prompt, hashValue(expectedAnswer), ipAddress?.trim() || null, buildUserAgentHash(userAgent), expiresAt, nowIso());
    return {
        mode: 'builtin',
        challengeId,
        prompt,
        expiresAt,
        requiresTwoFactor: (0, admin_2fa_service_1.isAdminTwoFactorEnabled)(),
    };
};
exports.createAdminLoginChallenge = createAdminLoginChallenge;
const verifyAdminLoginChallenge = ({ challengeId, answer, ipAddress, userAgent, }) => {
    (0, exports.purgeExpiredAdminLoginChallenges)();
    const challenge = db_1.db.prepare(`SELECT id, expected_hash, ip_address, user_agent_hash, attempts, max_attempts, expires_at, solved_at
     FROM admin_login_challenges
     WHERE id = ?`).get(challengeId);
    if (!challenge || challenge.solved_at || new Date(challenge.expires_at) <= new Date()) {
        throw new errors_1.AppError(400, 'LOGIN_CHALLENGE_EXPIRED', 'Verification challenge expired. Request a new one.');
    }
    const incomingIp = ipAddress?.trim() || null;
    const incomingUserAgentHash = buildUserAgentHash(userAgent);
    if (challenge.ip_address !== incomingIp || challenge.user_agent_hash !== incomingUserAgentHash) {
        throw new errors_1.AppError(400, 'LOGIN_CHALLENGE_INVALID', 'Verification challenge is not valid for this device.');
    }
    if (challenge.attempts >= challenge.max_attempts) {
        throw new errors_1.AppError(429, 'LOGIN_CHALLENGE_BLOCKED', 'Verification challenge exhausted. Request a new one.');
    }
    const normalizedAnswer = answer.trim().toUpperCase();
    const matches = hashValue(normalizedAnswer) === challenge.expected_hash;
    db_1.db.prepare(`UPDATE admin_login_challenges
     SET attempts = attempts + 1,
         solved_at = CASE WHEN ? THEN ? ELSE solved_at END
     WHERE id = ?`).run(matches ? 1 : 0, matches ? nowIso() : null, challenge.id);
    if (!matches) {
        throw new errors_1.AppError(400, 'LOGIN_CHALLENGE_INVALID', 'Verification answer is incorrect.');
    }
};
exports.verifyAdminLoginChallenge = verifyAdminLoginChallenge;
