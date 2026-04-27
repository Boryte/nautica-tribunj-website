"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.notFoundHandler = void 0;
const multer_1 = __importDefault(require("multer"));
const zod_1 = require("zod");
const logger_1 = require("../logger");
const errors_1 = require("../utils/errors");
const notFoundHandler = (_request, _response, next) => {
    next(new errors_1.AppError(404, 'NOT_FOUND', 'Route not found'));
};
exports.notFoundHandler = notFoundHandler;
const errorHandler = (error, request, response, _next) => {
    const appError = error instanceof zod_1.ZodError
        ? (0, errors_1.fromZodError)(error)
        : error instanceof multer_1.default.MulterError
            ? new errors_1.AppError(400, error.code === 'LIMIT_FILE_SIZE'
                ? 'MEDIA_FILE_TOO_LARGE'
                : error.code === 'LIMIT_FILE_COUNT'
                    ? 'MEDIA_TOO_MANY_FILES'
                    : 'MEDIA_UPLOAD_REJECTED', error.code === 'LIMIT_FILE_SIZE'
                ? 'Uploaded file exceeds the configured size limit'
                : error.code === 'LIMIT_FILE_COUNT'
                    ? 'Too many files uploaded in one request'
                    : 'Upload request was rejected')
            : error instanceof errors_1.AppError
                ? error
                : new errors_1.AppError(500, 'INTERNAL_ERROR', 'Unexpected server error');
    if (appError.statusCode >= 500) {
        logger_1.logger.error({ err: error, requestId: request.requestId }, 'request_failed');
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
exports.errorHandler = errorHandler;
