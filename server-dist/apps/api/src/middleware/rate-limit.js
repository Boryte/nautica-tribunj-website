"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminMutationLimiter = exports.loginLimiter = exports.publicContactLimiter = exports.publicReservationLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const jsonLimitHandler = (_request, response) => {
    response.status(429).json({
        ok: false,
        error: {
            code: 'RATE_LIMITED',
            message: 'Too many requests. Please slow down and try again shortly.',
        },
    });
};
exports.publicReservationLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    limit: 12,
    standardHeaders: true,
    legacyHeaders: false,
    handler: jsonLimitHandler,
});
exports.publicContactLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    limit: 8,
    standardHeaders: true,
    legacyHeaders: false,
    handler: jsonLimitHandler,
});
exports.loginLimiter = (0, express_rate_limit_1.default)({
    windowMs: 20 * 60 * 1000,
    limit: 7,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    requestWasSuccessful: (_request, response) => response.statusCode < 400 || response.statusCode === 400 || response.statusCode === 422,
    handler: jsonLimitHandler,
});
exports.adminMutationLimiter = (0, express_rate_limit_1.default)({
    windowMs: 5 * 60 * 1000,
    limit: 80,
    standardHeaders: true,
    legacyHeaders: false,
    handler: jsonLimitHandler,
});
