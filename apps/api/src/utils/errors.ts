import type { ZodError } from 'zod';

export class AppError extends Error {
  statusCode: number;
  code: string;
  details?: Record<string, unknown>;

  constructor(statusCode: number, code: string, message: string, details?: Record<string, unknown>) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export const fromZodError = (error: ZodError) =>
  new AppError(422, 'VALIDATION_ERROR', 'Validation failed', {
    fieldErrors: error.flatten().fieldErrors,
  });
