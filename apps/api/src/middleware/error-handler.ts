import type { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import { ZodError } from 'zod';
import { logger } from '../logger';
import { AppError, fromZodError } from '../utils/errors';

export const notFoundHandler = (_request: Request, _response: Response, next: NextFunction) => {
  next(new AppError(404, 'NOT_FOUND', 'Route not found'));
};

export const errorHandler = (error: unknown, request: Request, response: Response, _next: NextFunction) => {
  const appError =
    error instanceof ZodError
      ? fromZodError(error)
      : error instanceof multer.MulterError
        ? new AppError(
            400,
            error.code === 'LIMIT_FILE_SIZE'
              ? 'MEDIA_FILE_TOO_LARGE'
              : error.code === 'LIMIT_FILE_COUNT'
                ? 'MEDIA_TOO_MANY_FILES'
                : 'MEDIA_UPLOAD_REJECTED',
            error.code === 'LIMIT_FILE_SIZE'
              ? 'Uploaded file exceeds the configured size limit'
              : error.code === 'LIMIT_FILE_COUNT'
                ? 'Too many files uploaded in one request'
                : 'Upload request was rejected'
          )
      : error instanceof AppError
        ? error
        : new AppError(500, 'INTERNAL_ERROR', 'Unexpected server error');

  if (appError.statusCode >= 500) {
    logger.error({ err: error, requestId: request.requestId }, 'request_failed');
  }

  response.status(appError.statusCode).json({
    ok: false,
    error: {
      code: appError.code,
      message: appError.message,
      fieldErrors: appError.details?.fieldErrors,
      requestId: request.requestId,
      details: appError.details,
    },
  });
};
