"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = void 0;
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const pino_http_1 = __importDefault(require("pino-http"));
const config_1 = require("./config");
const auth_1 = require("./middleware/auth");
const error_handler_1 = require("./middleware/error-handler");
const request_context_1 = require("./middleware/request-context");
const logger_1 = require("./logger");
const admin_1 = require("./routes/admin");
const public_1 = require("./routes/public");
const createApp = () => {
    const app = (0, express_1.default)();
    app.disable('x-powered-by');
    app.set('trust proxy', config_1.env.TRUST_PROXY);
    app.use((0, pino_http_1.default)({
        logger: logger_1.logger,
        customProps: (request) => ({ requestId: request.requestId }),
    }));
    app.use(request_context_1.attachRequestContext);
    app.use((0, cors_1.default)({
        origin: (origin, callback) => {
            if (!origin || origin === config_1.env.FRONTEND_ORIGIN) {
                callback(null, true);
                return;
            }
            callback(new Error('CORS origin rejected'));
        },
        credentials: true,
        methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'x-csrf-token', 'x-request-id', 'x-admin-device-id'],
    }));
    app.use((0, helmet_1.default)({
        crossOriginResourcePolicy: false,
        hsts: config_1.env.NODE_ENV === 'production' ? undefined : false,
        noSniff: true,
        originAgentCluster: true,
        frameguard: { action: 'deny' },
        referrerPolicy: { policy: 'no-referrer' },
        permittedCrossDomainPolicies: { permittedPolicies: 'none' },
        xDnsPrefetchControl: { allow: false },
        ieNoOpen: true,
        contentSecurityPolicy: false,
    }));
    app.use((request, response, next) => {
        if (request.path.startsWith('/api/')) {
            response.setHeader('Vary', 'Origin, Cookie');
        }
        if (request.path.startsWith('/api/admin/') || request.path === '/api/admin/session') {
            response.setHeader('Cache-Control', 'no-store, private, max-age=0');
            response.setHeader('Pragma', 'no-cache');
        }
        next();
    });
    app.use(express_1.default.json({ limit: '100kb' }));
    app.use((0, cookie_parser_1.default)());
    app.use('/uploads', express_1.default.static(config_1.env.MEDIA_UPLOAD_DIR, { maxAge: '7d', immutable: false }));
    app.use(auth_1.requireSecureTransport);
    app.use(auth_1.loadAdminSession);
    app.use(auth_1.requireCsrf);
    app.use(public_1.publicRouter);
    app.use(admin_1.adminRouter);
    app.use(error_handler_1.notFoundHandler);
    app.use(error_handler_1.errorHandler);
    return app;
};
exports.createApp = createApp;
