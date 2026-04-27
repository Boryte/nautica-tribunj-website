import { Router } from 'express';
import { AppError } from '../utils/errors';
import { DEFAULT_LOCALE, contactSubmissionSchema, eventRegistrationSchema, resolveLocale, reservationSubmissionSchema } from '../../../../packages/shared/src';
import { listActiveAnnouncements } from '../services/announcement-service';
import { getBootstrapPayload, getBusinessSettings } from '../services/content-service';
import { getEventBySlug, listPublicEvents, registerForEvent } from '../services/event-service';
import { listGlimpseGroups } from '../services/glimpse-service';
import { listGalleryCollections, listMediaAssets } from '../services/media-service';
import { notify } from '../services/notification-service';
import { listFaqEntries } from '../services/faq-service';
import { getSocialFeed } from '../services/social-feed-service';
import { createReservation } from '../services/reservation-service';
import { storeWebVital } from '../services/observability-service';
import { publicContactLimiter, publicReservationLimiter } from '../middleware/rate-limit';

export const publicRouter = Router();

publicRouter.get('/health', (_request, response) => {
  response.json({ ok: true, data: { status: 'ok' } });
});

publicRouter.get('/ready', (_request, response) => {
  response.json({ ok: true, data: { status: 'ready' } });
});

publicRouter.get('/api/bootstrap', (request, response) => {
  const locale = resolveLocale(String(request.query.locale ?? DEFAULT_LOCALE));
  response.json({
    ok: true,
    data: getBootstrapPayload(locale, listPublicEvents().filter((event) => event.featured)),
  });
});

publicRouter.get('/api/events', (_request, response) => {
  response.json({ ok: true, data: listPublicEvents() });
});

publicRouter.get('/api/events/:slug', (request, response) => {
  response.json({ ok: true, data: getEventBySlug(request.params.slug) });
});

publicRouter.get('/api/announcements/active', (_request, response) => {
  response.json({ ok: true, data: listActiveAnnouncements() });
});

publicRouter.get('/api/glimpses', (_request, response) => {
  response.json({ ok: true, data: listGlimpseGroups(true) });
});

publicRouter.get('/api/gallery', (_request, response) => {
  response.json({ ok: true, data: listGalleryCollections({ readyOnly: true }) });
});

publicRouter.get('/api/faqs', (_request, response) => {
  response.json({ ok: true, data: listFaqEntries(true) });
});

publicRouter.get('/api/media', (_request, response) => {
  response.json({ ok: true, data: listMediaAssets({ readyOnly: true }) });
});

publicRouter.post('/api/observability/web-vitals', (request, response, next) => {
  try {
    storeWebVital(request.body, request.get('user-agent'));
    response.status(202).json({ ok: true, data: { accepted: true } });
  } catch (error) {
    next(error);
  }
});

publicRouter.get('/api/social-feed', async (_request, response, next) => {
  try {
    response.json({ ok: true, data: await getSocialFeed() });
  } catch (error) {
    next(error);
  }
});

publicRouter.post('/api/contact', publicContactLimiter, async (request, response, next) => {
  try {
    const payload = contactSubmissionSchema.parse({
      ...request.body,
      locale: resolveLocale(request.body?.locale),
    });

    if (payload.honeypot) {
      throw new AppError(400, 'SPAM_REJECTED', 'Submission rejected');
    }

    await notify({
      channel: 'email',
      eventType: 'contact_submission',
      target: getBusinessSettings().email,
      payload: {
        name: payload.name,
        email: payload.email,
        message: payload.message,
        locale: payload.locale,
      },
      requestId: request.requestId,
    });

    response.status(201).json({ ok: true, data: { submitted: true } });
  } catch (error) {
    next(error);
  }
});

publicRouter.post('/api/events/:id/register', publicReservationLimiter, async (request, response, next) => {
  try {
    const payload = eventRegistrationSchema.parse({
      ...request.body,
      locale: resolveLocale(request.body?.locale),
    });
    const result = registerForEvent(Number(request.params.id), payload);
    await notify({
      channel: 'email',
      eventType: 'event_registration',
      target: payload.email,
      payload: { eventId: Number(request.params.id), status: result.status },
      requestId: request.requestId,
    });
    response.status(201).json({ ok: true, data: result });
  } catch (error) {
    next(error);
  }
});

publicRouter.post('/api/reservations', publicReservationLimiter, async (request, response, next) => {
  try {
    const payload = reservationSubmissionSchema.parse({
      ...request.body,
      guests: Number(request.body?.guests),
      consent: Boolean(request.body?.consent),
      locale: resolveLocale(request.body?.locale),
    });
    const reservation = createReservation(payload);
    await notify({
      channel: 'email',
      eventType: 'reservation_created',
      target: payload.email,
      payload: { reservationId: reservation.id, status: reservation.status },
      requestId: request.requestId,
    });
    response.status(201).json({ ok: true, data: reservation });
  } catch (error) {
    next(error);
  }
});

publicRouter.get('/api/admin/session', (request, response) => {
  response.json({
    ok: true,
    data: request.adminSession ?? { authenticated: false, csrfToken: null, user: null },
  });
});
