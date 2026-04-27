"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminRouter = void 0;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const node_crypto_1 = __importDefault(require("node:crypto"));
const multer_1 = __importDefault(require("multer"));
const express_1 = require("express");
const src_1 = require("../../../../packages/shared/src");
const config_1 = require("../config");
const auth_1 = require("../middleware/auth");
const rate_limit_1 = require("../middleware/rate-limit");
const admin_2fa_service_1 = require("../services/admin-2fa-service");
const admin_2fa_setup_service_1 = require("../services/admin-2fa-setup-service");
const admin_login_challenge_service_1 = require("../services/admin-login-challenge-service");
const admin_login_security_service_1 = require("../services/admin-login-security-service");
const auth_service_1 = require("../services/auth-service");
const audit_service_1 = require("../services/audit-service");
const announcement_service_1 = require("../services/announcement-service");
const content_service_1 = require("../services/content-service");
const event_service_1 = require("../services/event-service");
const faq_service_1 = require("../services/faq-service");
const glimpse_service_1 = require("../services/glimpse-service");
const media_service_1 = require("../services/media-service");
const reservation_service_1 = require("../services/reservation-service");
const admin_query_1 = require("../utils/admin-query");
const errors_1 = require("../utils/errors");
(0, media_service_1.ensureMediaDirectory)();
const allowedUploadMimeTypes = new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'video/mp4',
    'video/quicktime',
    'video/webm',
]);
const allowedUploadExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.mp4', '.mov', '.webm']);
const uploadSignatureValidators = [
    {
        mimeTypes: ['image/jpeg'],
        extensions: ['.jpg', '.jpeg'],
        matches: (buffer) => buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff,
    },
    {
        mimeTypes: ['image/png'],
        extensions: ['.png'],
        matches: (buffer) => buffer.length >= 8 &&
            buffer[0] === 0x89 &&
            buffer[1] === 0x50 &&
            buffer[2] === 0x4e &&
            buffer[3] === 0x47 &&
            buffer[4] === 0x0d &&
            buffer[5] === 0x0a &&
            buffer[6] === 0x1a &&
            buffer[7] === 0x0a,
    },
    {
        mimeTypes: ['image/gif'],
        extensions: ['.gif'],
        matches: (buffer) => ['GIF87a', 'GIF89a'].includes(buffer.subarray(0, 6).toString('ascii')),
    },
    {
        mimeTypes: ['image/webp'],
        extensions: ['.webp'],
        matches: (buffer) => buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP',
    },
    {
        mimeTypes: ['video/mp4', 'video/quicktime'],
        extensions: ['.mp4', '.mov'],
        matches: (buffer) => buffer.length >= 12 && buffer.subarray(4, 8).toString('ascii') === 'ftyp',
    },
    {
        mimeTypes: ['video/webm'],
        extensions: ['.webm'],
        matches: (buffer) => buffer.length >= 4 && buffer[0] === 0x1a && buffer[1] === 0x45 && buffer[2] === 0xdf && buffer[3] === 0xa3,
    },
];
const removeUploadedFiles = (files) => {
    files?.forEach((file) => {
        if (file.path && node_fs_1.default.existsSync(file.path)) {
            node_fs_1.default.unlinkSync(file.path);
        }
    });
};
const assertUploadSafety = (file) => {
    const extension = node_path_1.default.extname(file.originalname).toLowerCase();
    if (!allowedUploadExtensions.has(extension)) {
        throw new errors_1.AppError(400, 'MEDIA_EXTENSION_NOT_ALLOWED', 'File extension is not allowed');
    }
    if (!allowedUploadMimeTypes.has(file.mimetype)) {
        throw new errors_1.AppError(400, 'MEDIA_TYPE_NOT_ALLOWED', 'File type is not allowed');
    }
    const signature = node_fs_1.default.readFileSync(file.path).subarray(0, 64);
    const validator = uploadSignatureValidators.find((entry) => entry.mimeTypes.includes(file.mimetype) && entry.extensions.includes(extension));
    if (!validator || !validator.matches(signature)) {
        throw new errors_1.AppError(400, 'MEDIA_SIGNATURE_INVALID', 'Uploaded file failed content validation');
    }
};
const storage = multer_1.default.diskStorage({
    destination: (_request, _file, callback) => callback(null, config_1.env.MEDIA_UPLOAD_DIR),
    filename: (_request, file, callback) => {
        const ext = node_path_1.default.extname(file.originalname).toLowerCase();
        const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${ext}`;
        callback(null, safeName);
    },
});
const upload = (0, multer_1.default)({
    storage,
    limits: { fileSize: config_1.env.MEDIA_MAX_FILE_SIZE_MB * 1024 * 1024, files: 8 },
    fileFilter: (_request, file, callback) => {
        const extension = node_path_1.default.extname(file.originalname).toLowerCase();
        const hasSafeCharacters = /^[a-zA-Z0-9._ -]+$/.test(file.originalname);
        if (!hasSafeCharacters || file.originalname.includes('..')) {
            callback(new errors_1.AppError(400, 'MEDIA_FILENAME_INVALID', 'Filename contains unsupported characters'));
            return;
        }
        if (!allowedUploadMimeTypes.has(file.mimetype) || !allowedUploadExtensions.has(extension)) {
            callback(new errors_1.AppError(400, 'MEDIA_TYPE_NOT_ALLOWED', 'Only vetted image and video uploads are supported'));
            return;
        }
        callback(null, true);
    },
});
const parseJsonField = (value) => {
    if (typeof value !== 'string')
        return value;
    return JSON.parse(value);
};
const normalizeDeviceId = (value) => {
    if (typeof value !== 'string')
        return node_crypto_1.default.randomUUID();
    const trimmed = value.trim();
    return trimmed.length >= 8 && trimmed.length <= 128 ? trimmed : node_crypto_1.default.randomUUID();
};
exports.adminRouter = (0, express_1.Router)();
exports.adminRouter.get('/api/admin/auth/challenge', (request, response) => {
    response.json({
        ok: true,
        data: (0, admin_login_challenge_service_1.createAdminLoginChallenge)(request.ip, request.header('user-agent')),
    });
});
exports.adminRouter.post('/api/admin/login', rate_limit_1.loginLimiter, (request, response, next) => {
    const deviceId = normalizeDeviceId(request.header('x-admin-device-id') ?? request.body?.deviceId);
    try {
        const payload = src_1.adminLoginSchema.parse({
            ...request.body,
            deviceId,
        });
        (0, admin_login_security_service_1.assertLoginAllowed)({ email: payload.email, ipAddress: request.ip, deviceId });
        (0, admin_login_challenge_service_1.verifyAdminLoginChallenge)({
            challengeId: payload.challengeId,
            answer: payload.challengeAnswer,
            ipAddress: request.ip,
            userAgent: request.header('user-agent'),
        });
        (0, admin_2fa_service_1.verifyAdminTwoFactorCode)(payload.oneTimeCode);
        const admin = (0, auth_service_1.authenticateAdmin)({
            email: payload.email,
            password: payload.password,
            ipAddress: request.ip,
            deviceId,
        });
        const session = (0, auth_service_1.createSession)(admin.id, request.ip, request.header('user-agent'));
        response.cookie(config_1.env.SESSION_COOKIE_NAME, session.sessionId, {
            httpOnly: true,
            sameSite: 'strict',
            secure: config_1.isProduction,
            maxAge: config_1.env.SESSION_TTL_HOURS * 60 * 60 * 1000,
            path: '/',
        });
        (0, audit_service_1.writeAuditLog)({
            adminId: admin.id,
            action: 'admin.login',
            entityType: 'session',
            entityId: session.sessionId,
            requestId: request.requestId,
        });
        response.json({
            ok: true,
            data: {
                authenticated: true,
                csrfToken: session.csrfToken,
                user: admin,
            },
        });
    }
    catch (error) {
        const loginEmail = typeof request.body?.email === 'string' ? request.body.email.trim().toLowerCase() : null;
        const errorCode = error instanceof Error ? ('code' in error ? String(error.code ?? 'UNKNOWN') : error.name) : 'UNKNOWN';
        if (loginEmail && ['ADMIN_2FA_REQUIRED', 'ADMIN_2FA_INVALID'].includes(errorCode)) {
            (0, admin_login_security_service_1.recordLoginFailure)({ email: loginEmail, ipAddress: request.ip, deviceId });
        }
        (0, audit_service_1.writeAuditLog)({
            action: 'admin.login.failed',
            entityType: 'session',
            entityId: null,
            details: {
                email: loginEmail,
                ipAddress: request.ip,
                userAgent: request.header('user-agent') ?? null,
                code: errorCode,
            },
            requestId: request.requestId,
        });
        next(error);
    }
});
exports.adminRouter.post('/api/admin/logout', auth_1.requireAdmin, (request, response) => {
    const sessionId = request.cookies?.[config_1.env.SESSION_COOKIE_NAME];
    if (sessionId)
        (0, auth_service_1.invalidateSession)(sessionId);
    response.clearCookie(config_1.env.SESSION_COOKIE_NAME, { path: '/', sameSite: 'strict', secure: config_1.isProduction });
    response.json({ ok: true, data: { loggedOut: true } });
});
exports.adminRouter.get('/api/admin/dashboard', auth_1.requireAdmin, (_request, response) => {
    response.json({
        ok: true,
        data: {
            reservations: (0, reservation_service_1.listReservations)().slice(0, 5),
            events: (0, event_service_1.listAllEvents)().slice(0, 5),
            announcements: (0, announcement_service_1.listActiveAnnouncements)(),
            mediaCount: (0, media_service_1.listMediaAssets)().length,
            faqCount: (0, faq_service_1.listFaqEntries)(false).length,
        },
    });
});
exports.adminRouter.get('/api/admin/security/2fa/setup', auth_1.requireAdmin, async (_request, response, next) => {
    try {
        response.json({
            ok: true,
            data: await (0, admin_2fa_setup_service_1.createAdminTwoFactorSetup)(),
        });
    }
    catch (error) {
        next(error);
    }
});
exports.adminRouter.get('/api/admin/reservations', auth_1.requireAdmin, (request, response) => {
    response.json({ ok: true, data: (0, reservation_service_1.listReservationsPaginated)((0, admin_query_1.parseAdminListQuery)(request.query)) });
});
exports.adminRouter.patch('/api/admin/reservations/:id/status', auth_1.requireAdmin, rate_limit_1.adminMutationLimiter, (request, response, next) => {
    try {
        const payload = src_1.reservationStatusUpdateSchema.parse(request.body);
        const reservation = (0, reservation_service_1.updateReservationStatus)(Number(request.params.id), payload.status, request.adminSession?.user?.id, payload.adminNotes);
        (0, audit_service_1.writeAuditLog)({
            adminId: request.adminSession?.user?.id,
            action: 'reservation.status.updated',
            entityType: 'reservation',
            entityId: String(request.params.id),
            details: payload,
            requestId: request.requestId,
        });
        response.json({ ok: true, data: reservation });
    }
    catch (error) {
        next(error);
    }
});
exports.adminRouter.get('/api/admin/events', auth_1.requireAdmin, (request, response) => {
    response.json({ ok: true, data: (0, event_service_1.listAllEventsPaginated)((0, admin_query_1.parseAdminListQuery)(request.query)) });
});
exports.adminRouter.post('/api/admin/events', auth_1.requireAdmin, rate_limit_1.adminMutationLimiter, (request, response, next) => {
    try {
        const payload = src_1.eventUpsertSchema.parse(request.body);
        const event = (0, event_service_1.upsertEvent)(payload);
        (0, audit_service_1.writeAuditLog)({
            adminId: request.adminSession?.user?.id,
            action: 'event.created',
            entityType: 'event',
            entityId: String(event.id),
            requestId: request.requestId,
        });
        response.status(201).json({ ok: true, data: event });
    }
    catch (error) {
        next(error);
    }
});
exports.adminRouter.put('/api/admin/events/:id', auth_1.requireAdmin, rate_limit_1.adminMutationLimiter, (request, response, next) => {
    try {
        const payload = src_1.eventUpsertSchema.parse(request.body);
        const event = (0, event_service_1.upsertEvent)(payload, Number(request.params.id));
        (0, audit_service_1.writeAuditLog)({
            adminId: request.adminSession?.user?.id,
            action: 'event.updated',
            entityType: 'event',
            entityId: String(request.params.id),
            requestId: request.requestId,
        });
        response.json({ ok: true, data: event });
    }
    catch (error) {
        next(error);
    }
});
exports.adminRouter.get('/api/admin/menu', auth_1.requireAdmin, (request, response) => {
    response.json({ ok: true, data: (0, content_service_1.listMenuItemsPaginated)((0, admin_query_1.parseAdminListQuery)(request.query)) });
});
exports.adminRouter.post('/api/admin/menu', auth_1.requireAdmin, rate_limit_1.adminMutationLimiter, (request, response, next) => {
    try {
        const payload = src_1.menuItemUpsertSchema.parse(request.body);
        const id = (0, content_service_1.upsertMenuItem)(payload);
        (0, audit_service_1.writeAuditLog)({
            adminId: request.adminSession?.user?.id,
            action: 'menu_item.upserted',
            entityType: 'menu_item',
            entityId: String(id),
            requestId: request.requestId,
        });
        response.status(201).json({ ok: true, data: { id } });
    }
    catch (error) {
        next(error);
    }
});
exports.adminRouter.put('/api/admin/settings', auth_1.requireAdmin, rate_limit_1.adminMutationLimiter, (request, response, next) => {
    try {
        const payload = src_1.businessSettingsSchema.parse(request.body);
        const settingsPayload = {
            businessName: payload.businessName,
            timezone: payload.timezone,
            phone: payload.phone,
            whatsappPhone: payload.whatsappPhone,
            email: payload.email,
            address: payload.address,
            city: payload.city,
        };
        (0, content_service_1.updateBusinessSettings)(settingsPayload);
        (0, audit_service_1.writeAuditLog)({
            adminId: request.adminSession?.user?.id,
            action: 'business_settings.updated',
            entityType: 'business_settings',
            entityId: '1',
            requestId: request.requestId,
        });
        response.json({ ok: true, data: payload });
    }
    catch (error) {
        next(error);
    }
});
exports.adminRouter.get('/api/admin/announcements', auth_1.requireAdmin, (request, response) => {
    const query = (0, admin_query_1.parseAdminListQuery)(request.query);
    const normalizedSearch = query.search.toLowerCase();
    const items = (0, announcement_service_1.listAnnouncements)().filter((announcement) => (!query.status || announcement.status === query.status) &&
        (!normalizedSearch ||
            announcement.localizations.hr.title.toLowerCase().includes(normalizedSearch) ||
            announcement.localizations.en.title.toLowerCase().includes(normalizedSearch) ||
            announcement.localizations.hr.body.toLowerCase().includes(normalizedSearch) ||
            announcement.localizations.en.body.toLowerCase().includes(normalizedSearch)));
    response.json({
        ok: true,
        data: {
            items: items.slice((query.page - 1) * query.pageSize, query.page * query.pageSize),
            total: items.length,
            page: query.page,
            pageSize: query.pageSize,
        },
    });
});
exports.adminRouter.post('/api/admin/announcements', auth_1.requireAdmin, rate_limit_1.adminMutationLimiter, (request, response, next) => {
    try {
        const payload = src_1.announcementUpsertSchema.parse(request.body);
        const announcement = (0, announcement_service_1.upsertAnnouncement)(payload);
        (0, audit_service_1.writeAuditLog)({
            adminId: request.adminSession?.user?.id,
            action: payload.id ? 'announcement.updated' : 'announcement.created',
            entityType: 'announcement',
            entityId: String(announcement.id),
            requestId: request.requestId,
        });
        response.status(payload.id ? 200 : 201).json({ ok: true, data: announcement });
    }
    catch (error) {
        next(error);
    }
});
exports.adminRouter.delete('/api/admin/announcements/:id', auth_1.requireAdmin, rate_limit_1.adminMutationLimiter, (request, response, next) => {
    try {
        const result = (0, announcement_service_1.deleteAnnouncement)(Number(request.params.id));
        (0, audit_service_1.writeAuditLog)({
            adminId: request.adminSession?.user?.id,
            action: 'announcement.deleted',
            entityType: 'announcement',
            entityId: String(request.params.id),
            requestId: request.requestId,
        });
        response.json({ ok: true, data: result });
    }
    catch (error) {
        next(error);
    }
});
exports.adminRouter.get('/api/admin/glimpses', auth_1.requireAdmin, (_request, response) => {
    response.json({ ok: true, data: (0, glimpse_service_1.listGlimpseGroups)(false) });
});
exports.adminRouter.post('/api/admin/glimpses/groups', auth_1.requireAdmin, rate_limit_1.adminMutationLimiter, (request, response, next) => {
    try {
        const payload = src_1.glimpseGroupUpsertSchema.parse(request.body);
        const group = (0, glimpse_service_1.upsertGlimpseGroup)(payload);
        (0, audit_service_1.writeAuditLog)({
            adminId: request.adminSession?.user?.id,
            action: payload.id ? 'glimpse_group.updated' : 'glimpse_group.created',
            entityType: 'glimpse_group',
            entityId: String(group.id),
            requestId: request.requestId,
        });
        response.status(payload.id ? 200 : 201).json({ ok: true, data: group });
    }
    catch (error) {
        next(error);
    }
});
exports.adminRouter.post('/api/admin/glimpses/slides', auth_1.requireAdmin, rate_limit_1.adminMutationLimiter, (request, response, next) => {
    try {
        const payload = src_1.glimpseSlideUpsertSchema.parse(request.body);
        const slide = (0, glimpse_service_1.upsertGlimpseSlide)(payload);
        (0, audit_service_1.writeAuditLog)({
            adminId: request.adminSession?.user?.id,
            action: payload.id ? 'glimpse_slide.updated' : 'glimpse_slide.created',
            entityType: 'glimpse_slide',
            entityId: String(slide.id),
            requestId: request.requestId,
        });
        response.status(payload.id ? 200 : 201).json({ ok: true, data: slide });
    }
    catch (error) {
        next(error);
    }
});
exports.adminRouter.get('/api/admin/media', auth_1.requireAdmin, (request, response) => {
    response.json({ ok: true, data: { assets: (0, media_service_1.listMediaAssetsPaginated)((0, admin_query_1.parseAdminListQuery)(request.query)), collections: (0, media_service_1.listGalleryCollections)() } });
});
exports.adminRouter.post('/api/admin/media/upload', auth_1.requireAdmin, rate_limit_1.adminMutationLimiter, upload.array('files', 8), (request, response, next) => {
    try {
        const files = request.files;
        if (!files?.length) {
            response.status(400).json({ ok: false, error: { code: 'MEDIA_REQUIRED', message: 'At least one file is required' } });
            return;
        }
        files.forEach(assertUploadSafety);
        const assets = files.map((file) => (0, media_service_1.createMediaAsset)(file));
        (0, audit_service_1.writeAuditLog)({
            adminId: request.adminSession?.user?.id,
            action: 'media.uploaded',
            entityType: 'media_asset',
            entityId: String(assets[0]?.id ?? ''),
            details: { count: assets.length },
            requestId: request.requestId,
        });
        response.status(201).json({ ok: true, data: assets });
    }
    catch (error) {
        removeUploadedFiles(request.files);
        next(error);
    }
});
exports.adminRouter.put('/api/admin/media/:id', auth_1.requireAdmin, rate_limit_1.adminMutationLimiter, (request, response, next) => {
    try {
        const payload = src_1.mediaAssetUpsertSchema.parse({
            ...request.body,
            tags: parseJsonField(request.body.tags),
            collections: parseJsonField(request.body.collections),
            localizations: parseJsonField(request.body.localizations),
        });
        const asset = (0, media_service_1.upsertMediaAssetMetadata)(payload, Number(request.params.id));
        (0, audit_service_1.writeAuditLog)({
            adminId: request.adminSession?.user?.id,
            action: 'media.updated',
            entityType: 'media_asset',
            entityId: String(request.params.id),
            requestId: request.requestId,
        });
        response.json({ ok: true, data: asset });
    }
    catch (error) {
        next(error);
    }
});
exports.adminRouter.delete('/api/admin/media/:id', auth_1.requireAdmin, rate_limit_1.adminMutationLimiter, (request, response, next) => {
    try {
        (0, media_service_1.deleteMediaAsset)(Number(request.params.id));
        (0, audit_service_1.writeAuditLog)({
            adminId: request.adminSession?.user?.id,
            action: 'media.deleted',
            entityType: 'media_asset',
            entityId: String(request.params.id),
            requestId: request.requestId,
        });
        response.json({ ok: true, data: { deleted: true } });
    }
    catch (error) {
        next(error);
    }
});
exports.adminRouter.get('/api/admin/faqs', auth_1.requireAdmin, (request, response) => {
    response.json({ ok: true, data: (0, faq_service_1.listFaqEntriesPaginated)((0, admin_query_1.parseAdminListQuery)(request.query)) });
});
exports.adminRouter.post('/api/admin/faqs', auth_1.requireAdmin, rate_limit_1.adminMutationLimiter, (request, response, next) => {
    try {
        const payload = src_1.faqUpsertSchema.parse(request.body);
        const faq = (0, faq_service_1.upsertFaqEntry)(payload);
        (0, audit_service_1.writeAuditLog)({
            adminId: request.adminSession?.user?.id,
            action: payload.id ? 'faq.updated' : 'faq.created',
            entityType: 'faq',
            entityId: String(faq.id),
            requestId: request.requestId,
        });
        response.status(payload.id ? 200 : 201).json({ ok: true, data: faq });
    }
    catch (error) {
        next(error);
    }
});
exports.adminRouter.delete('/api/admin/faqs/:id', auth_1.requireAdmin, rate_limit_1.adminMutationLimiter, (request, response, next) => {
    try {
        const result = (0, faq_service_1.deleteFaqEntry)(Number(request.params.id));
        (0, audit_service_1.writeAuditLog)({
            adminId: request.adminSession?.user?.id,
            action: 'faq.deleted',
            entityType: 'faq',
            entityId: String(request.params.id),
            requestId: request.requestId,
        });
        response.json({ ok: true, data: result });
    }
    catch (error) {
        next(error);
    }
});
