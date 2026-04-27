"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyAdminTwoFactorCode = exports.isAdminTwoFactorEnabled = void 0;
const node_crypto_1 = __importDefault(require("node:crypto"));
const config_1 = require("../config");
const errors_1 = require("../utils/errors");
const TOTP_STEP_SECONDS = 30;
const TOTP_DIGITS = 6;
const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const decodeBase32 = (value) => {
    const normalized = value.toUpperCase().replace(/=+$/g, '').replace(/[\s-]+/g, '');
    let bits = '';
    for (const character of normalized) {
        const index = BASE32_ALPHABET.indexOf(character);
        if (index === -1) {
            throw new errors_1.AppError(500, 'ADMIN_2FA_CONFIG_INVALID', 'Admin 2FA secret is invalid');
        }
        bits += index.toString(2).padStart(5, '0');
    }
    const bytes = [];
    for (let index = 0; index + 8 <= bits.length; index += 8) {
        bytes.push(Number.parseInt(bits.slice(index, index + 8), 2));
    }
    return Buffer.from(bytes);
};
const getTotpCounterBuffer = (counter) => {
    const buffer = Buffer.alloc(8);
    buffer.writeUInt32BE(Math.floor(counter / 0x100000000), 0);
    buffer.writeUInt32BE(counter >>> 0, 4);
    return buffer;
};
const generateTotpCode = (secret, offsetSteps = 0) => {
    const counter = Math.floor(Date.now() / (TOTP_STEP_SECONDS * 1000)) + offsetSteps;
    const digest = node_crypto_1.default.createHmac('sha1', secret).update(getTotpCounterBuffer(counter)).digest();
    const offset = digest[digest.length - 1] & 0x0f;
    const binaryCode = ((digest[offset] & 0x7f) << 24) |
        ((digest[offset + 1] & 0xff) << 16) |
        ((digest[offset + 2] & 0xff) << 8) |
        (digest[offset + 3] & 0xff);
    return String(binaryCode % 10 ** TOTP_DIGITS).padStart(TOTP_DIGITS, '0');
};
const getTotpSecret = () => decodeBase32(config_1.env.ADMIN_2FA_SECRET ?? '');
const isAdminTwoFactorEnabled = () => config_1.env.ADMIN_2FA_ENABLED;
exports.isAdminTwoFactorEnabled = isAdminTwoFactorEnabled;
const verifyAdminTwoFactorCode = (value) => {
    if (!(0, exports.isAdminTwoFactorEnabled)())
        return;
    const code = value?.trim();
    if (!code || !/^\d{6}$/.test(code)) {
        throw new errors_1.AppError(401, 'ADMIN_2FA_REQUIRED', 'Authenticator code is required');
    }
    const secret = getTotpSecret();
    for (let offset = -config_1.env.ADMIN_2FA_WINDOW; offset <= config_1.env.ADMIN_2FA_WINDOW; offset += 1) {
        if (generateTotpCode(secret, offset) === code)
            return;
    }
    throw new errors_1.AppError(401, 'ADMIN_2FA_INVALID', 'Authenticator code is invalid');
};
exports.verifyAdminTwoFactorCode = verifyAdminTwoFactorCode;
