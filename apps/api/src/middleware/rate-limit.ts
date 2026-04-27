import rateLimit from 'express-rate-limit';
import type { Request, Response } from 'express';

const jsonLimitHandler = (_request: Request, response: Response) => {
  response.status(429).json({
    ok: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many requests. Please slow down and try again shortly.',
    },
  });
};

export const publicReservationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 12,
  standardHeaders: true,
  legacyHeaders: false,
  handler: jsonLimitHandler,
});

export const publicContactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 8,
  standardHeaders: true,
  legacyHeaders: false,
  handler: jsonLimitHandler,
});

export const loginLimiter = rateLimit({
  windowMs: 20 * 60 * 1000,
  limit: 7,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  requestWasSuccessful: (_request, response) => response.statusCode < 400 || response.statusCode === 400 || response.statusCode === 422,
  handler: jsonLimitHandler,
});

export const adminMutationLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  limit: 80,
  standardHeaders: true,
  legacyHeaders: false,
  handler: jsonLimitHandler,
});
