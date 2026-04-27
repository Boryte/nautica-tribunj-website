"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fromZodError = exports.AppError = void 0;
class AppError extends Error {
    statusCode;
    code;
    details;
    constructor(statusCode, code, message, details) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
    }
}
exports.AppError = AppError;
const fromZodError = (error) => new AppError(422, 'VALIDATION_ERROR', 'Validation failed', {
    fieldErrors: error.flatten().fieldErrors,
});
exports.fromZodError = fromZodError;
