"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.publicRouter = void 0;
const express_1 = require("express");
const errors_1 = require("../utils/errors");
const src_1 = require("../../../../packages/shared/src");
const announcement_service_1 = require("../services/announcement-service");
const content_service_1 = require("../services/content-service");
const event_service_1 = require("../services/event-service");
const glimpse_service_1 = require("../services/glimpse-service");
const media_service_1 = require("../services/media-service");
const notification_service_1 = require("../services/notification-service");
const faq_service_1 = require("../services/faq-service");
const social_feed_service_1 = require("../services/social-feed-service");
const reservation_service_1 = require("../services/reservation-service");
const observability_service_1 = require("../services/observability-service");
const rate_limit_1 = require("../middleware/rate-limit");
exports.publicRouter = (0, express_1.Router)();
exports.publicRouter.get('/health', (_request, response) => {
    response.json({ ok: true, data: { status: 'ok' } });
});
exports.publicRouter.get('/ready', (_request, response) => {
    response.json({ ok: true, data: { status: 'ready' } });
});
exports.publicRouter.get('/api/bootstrap', (request, response) => {
    const locale = (0, src_1.resolveLocale)(String(request.query.locale ?? src_1.DEFAULT_LOCALE));
    response.json({
        ok: true,
        data: (0, content_service_1.getBootstrapPayload)(locale, (0, event_service_1.listPublicEvents)().filter((event) => event.featured)),
    });
});
exports.publicRouter.get('/api/events', (_request, response) => {
    response.json({ ok: true, data: (0, event_service_1.listPublicEvents)() });
});
exports.publicRouter.get('/api/events/:slug', (request, response) => {
    response.json({ ok: true, data: (0, event_service_1.getEventBySlug)(request.params.slug) });
});
exports.publicRouter.get('/api/announcements/active', (_request, response) => {
    response.json({ ok: true, data: (0, announcement_service_1.listActiveAnnouncements)() });
});
exports.publicRouter.get('/api/glimpses', (_request, response) => {
    response.json({ ok: true, data: (0, glimpse_service_1.listGlimpseGroups)(true) });
});
exports.publicRouter.get('/api/gallery', (_request, response) => {
    response.json({ ok: true, data: (0, media_service_1.listGalleryCollections)({ readyOnly: true }) });
});
exports.publicRouter.get('/api/faqs', (_request, response) => {
    response.json({ ok: true, data: (0, faq_service_1.listFaqEntries)(true) });
});
exports.publicRouter.get('/api/media', (_request, response) => {
    response.json({ ok: true, data: (0, media_service_1.listMediaAssets)({ readyOnly: true }) });
});
exports.publicRouter.post('/api/observability/web-vitals', (request, response, next) => {
    try {
        (0, observability_service_1.storeWebVital)(request.body, request.get('user-agent'));
        response.status(202).json({ ok: true, data: { accepted: true } });
    }
    catch (error) {
        next(error);
    }
});
exports.publicRouter.get('/api/social-feed', async (_request, response, next) => {
    try {
        response.json({ ok: true, data: await (0, social_feed_service_1.getSocialFeed)() });
    }
    catch (error) {
        next(error);
    }
});
exports.publicRouter.post('/api/contact', rate_limit_1.publicContactLimiter, async (request, response, next) => {
    try {
        const payload = src_1.contactSubmissionSchema.parse({
            ...request.body,
            locale: (0, src_1.resolveLocale)(request.body?.locale),
        });
        if (payload.honeypot) {
            throw new errors_1.AppError(400, 'SPAM_REJECTED', 'Submission rejected');
        }
        await (0, notification_service_1.notify)({
            channel: 'email',
            eventType: 'contact_submission',
            target: (0, content_service_1.getBusinessSettings)().email,
            payload: {
                name: payload.name,
                email: payload.email,
                message: payload.message,
                locale: payload.locale,
            },
            requestId: request.requestId,
        });
        response.status(201).json({ ok: true, data: { submitted: true } });
    }
    catch (error) {
        next(error);
    }
});
exports.publicRouter.post('/api/events/:id/register', rate_limit_1.publicReservationLimiter, async (request, response, next) => {
    try {
        const payload = src_1.eventRegistrationSchema.parse({
            ...request.body,
            locale: (0, src_1.resolveLocale)(request.body?.locale),
        });
        const result = (0, event_service_1.registerForEvent)(Number(request.params.id), payload);
        await (0, notification_service_1.notify)({
            channel: 'email',
            eventType: 'event_registration',
            target: payload.email,
            payload: { eventId: Number(request.params.id), status: result.status },
            requestId: request.requestId,
        });
        response.status(201).json({ ok: true, data: result });
    }
    catch (error) {
        next(error);
    }
});
exports.publicRouter.post('/api/reservations', rate_limit_1.publicReservationLimiter, async (request, response, next) => {
    try {
        const payload = src_1.reservationSubmissionSchema.parse({
            ...request.body,
            guests: Number(request.body?.guests),
            consent: Boolean(request.body?.consent),
            locale: (0, src_1.resolveLocale)(request.body?.locale),
        });
        const reservation = (0, reservation_service_1.createReservation)(payload);
        await (0, notification_service_1.notify)({
            channel: 'email',
            eventType: 'reservation_created',
            target: payload.email,
            payload: { reservationId: reservation.id, status: reservation.status },
            requestId: request.requestId,
        });
        response.status(201).json({ ok: true, data: reservation });
    }
    catch (error) {
        next(error);
    }
});
exports.publicRouter.get('/api/admin/session', (request, response) => {
    response.json({
        ok: true,
        data: request.adminSession ?? { authenticated: false, csrfToken: null, user: null },
    });
});
