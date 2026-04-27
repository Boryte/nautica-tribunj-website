import type { EventDTO, EventRegistrationInput, EventUpsertInput, LocaleCode } from '../../../../packages/shared/src';
import { db, runInTransaction } from '../db';
import { paginateItems, type AdminListQuery } from '../utils/admin-query';
import { AppError } from '../utils/errors';
import { nowIso } from '../utils/time';
import { mapMediaAsset, resolveLegacyMediaUrl } from './media-service';

type EventRow = {
  id: number;
  slug: string;
  status: EventDTO['status'];
  featured: number;
  capacity: number;
  waitlist_enabled: number;
  starts_at: string;
  ends_at: string | null;
  image_url: string | null;
  poster_media_id: number | null;
  category: EventDTO['category'];
  timezone: string;
  reservation_mode: EventDTO['reservationMode'];
  price_label: string | null;
  ticket_url: string | null;
  linked_announcement_id: number | null;
  linked_glimpse_group_id: number | null;
};

const parseTags = (eventId: number) =>
  (db.prepare('SELECT tag FROM event_tags WHERE event_id = ? ORDER BY tag ASC').all(eventId) as Array<{ tag: string }>).map((row) => row.tag);

const getGallery = (eventId: number) =>
  (
    db.prepare(
      `SELECT media_assets.*
       FROM event_media
       INNER JOIN media_assets ON media_assets.id = event_media.media_asset_id
       WHERE event_media.event_id = ?
       ORDER BY event_media.sort_order ASC, media_assets.created_at DESC`
    ).all(eventId) as Parameters<typeof mapMediaAsset>[0][]
  ).map(mapMediaAsset);

const mapEvent = (row: EventRow): EventDTO => {
  const registrationsCount = Number(
    (db.prepare(`SELECT COUNT(*) as count FROM event_registrations WHERE event_id = ? AND status = 'registered'`).get(row.id) as { count: number }).count
  );
  const localizations = db.prepare(
    `SELECT locale, title, teaser, description
     FROM event_localizations
     WHERE event_id = ?`
  ).all(row.id) as Array<{ locale: LocaleCode; title: string; teaser: string | null; description: string }>;

  const fallback = localizations.find((entry) => entry.locale === 'hr') ?? { title: '', teaser: '', description: '' };

  return {
    id: row.id,
    slug: row.slug,
    status: row.status,
    featured: Boolean(row.featured),
    capacity: row.capacity,
    registrationsCount,
    waitlistEnabled: Boolean(row.waitlist_enabled),
    soldOut: registrationsCount >= row.capacity,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    imageUrl: resolveLegacyMediaUrl(row.image_url),
    posterMediaId: row.poster_media_id,
    category: row.category,
    timezone: row.timezone,
    reservationMode: row.reservation_mode,
    priceLabel: row.price_label,
    ticketUrl: row.ticket_url,
    linkedAnnouncementId: row.linked_announcement_id,
    linkedGlimpseGroupId: row.linked_glimpse_group_id,
    tags: parseTags(row.id),
    gallery: getGallery(row.id),
    localizations: {
      hr: {
        title: fallback.title,
        teaser: fallback.teaser || fallback.description,
        description: fallback.description,
      },
      en: (() => {
        const localized = localizations.find((entry) => entry.locale === 'en') ?? fallback;
        return {
          title: localized.title,
          teaser: localized.teaser || localized.description,
          description: localized.description,
        };
      })(),
    },
  };
};

export const listPublicEvents = (): EventDTO[] =>
  (db.prepare(`SELECT * FROM events WHERE status = 'published' ORDER BY featured DESC, starts_at ASC`).all() as EventRow[]).map(mapEvent);

export const listAllEvents = (): EventDTO[] =>
  (db.prepare('SELECT * FROM events ORDER BY starts_at DESC').all() as EventRow[]).map(mapEvent);

export const listAllEventsPaginated = (query: AdminListQuery): ReturnType<typeof paginateItems<EventDTO>> => {
  const normalizedSearch = query.search.toLowerCase();
  const items = listAllEvents().filter((event) =>
    (!query.status || event.status === query.status) &&
    (!normalizedSearch ||
      event.category.toLowerCase().includes(normalizedSearch) ||
      event.localizations.hr.title.toLowerCase().includes(normalizedSearch) ||
      event.localizations.en.title.toLowerCase().includes(normalizedSearch))
  );
  return paginateItems(items, query.page, query.pageSize);
};

export const getEventBySlug = (slug: string): EventDTO => {
  const row = db.prepare('SELECT * FROM events WHERE slug = ?').get(slug) as EventRow | undefined;
  if (!row) throw new AppError(404, 'EVENT_NOT_FOUND', 'Event not found');
  return mapEvent(row);
};

export const registerForEvent = (eventId: number, input: EventRegistrationInput) =>
  runInTransaction(() => {
    const row = db.prepare('SELECT * FROM events WHERE id = ?').get(eventId) as EventRow | undefined;
    if (!row || row.status !== 'published') throw new AppError(404, 'EVENT_NOT_FOUND', 'Event not found');

    const event = mapEvent(row);
    const existing = db.prepare(
      `SELECT id FROM event_registrations
       WHERE event_id = ? AND attendee_email = ? AND status IN ('registered', 'waitlist')`
    ).get(eventId, input.email) as { id: number } | undefined;
    if (existing) throw new AppError(409, 'EVENT_ALREADY_REGISTERED', 'This email is already registered for the event');

    const status = event.soldOut ? (event.waitlistEnabled ? 'waitlist' : null) : 'registered';
    if (!status) throw new AppError(409, 'EVENT_SOLD_OUT', 'This event is sold out');

    db.prepare(
      `INSERT INTO event_registrations (event_id, status, attendee_name, attendee_email, attendee_phone, locale, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(eventId, status, input.name, input.email, input.phone, input.locale, nowIso(), nowIso());

    return { status };
  });

export const upsertEvent = (input: EventUpsertInput, eventId?: number) =>
  runInTransaction(() => {
    const id =
      eventId ??
      Number(
        db
          .prepare(
            `INSERT INTO events
             (slug, status, featured, capacity, waitlist_enabled, starts_at, ends_at, image_url, poster_media_id, category, timezone, reservation_mode, price_label, ticket_url, linked_announcement_id, linked_glimpse_group_id, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
          )
          .run(
            input.slug,
            input.status,
            input.featured ? 1 : 0,
            input.capacity,
            input.waitlistEnabled ? 1 : 0,
            input.startsAt,
            input.endsAt,
            input.imageUrl,
            input.posterMediaId,
            input.category,
            input.timezone,
            input.reservationMode,
            input.priceLabel,
            input.ticketUrl,
            input.linkedAnnouncementId,
            input.linkedGlimpseGroupId,
            nowIso(),
            nowIso()
          ).lastInsertRowid
      );

    if (eventId) {
      db.prepare(
        `UPDATE events
         SET slug = ?, status = ?, featured = ?, capacity = ?, waitlist_enabled = ?, starts_at = ?, ends_at = ?, image_url = ?, poster_media_id = ?, category = ?, timezone = ?, reservation_mode = ?, price_label = ?, ticket_url = ?, linked_announcement_id = ?, linked_glimpse_group_id = ?, updated_at = ?
         WHERE id = ?`
      ).run(
        input.slug,
        input.status,
        input.featured ? 1 : 0,
        input.capacity,
        input.waitlistEnabled ? 1 : 0,
        input.startsAt,
        input.endsAt,
        input.imageUrl,
        input.posterMediaId,
        input.category,
        input.timezone,
        input.reservationMode,
        input.priceLabel,
        input.ticketUrl,
        input.linkedAnnouncementId,
        input.linkedGlimpseGroupId,
        nowIso(),
        eventId
      );
    }

    for (const locale of ['hr', 'en'] as const) {
      db.prepare(
        `INSERT INTO event_localizations (event_id, locale, title, teaser, description, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(event_id, locale) DO UPDATE SET title = excluded.title, teaser = excluded.teaser, description = excluded.description, updated_at = excluded.updated_at`
      ).run(id, locale, input.localizations[locale].title, input.localizations[locale].teaser, input.localizations[locale].description, nowIso(), nowIso());
    }

    db.prepare('DELETE FROM event_tags WHERE event_id = ?').run(id);
    input.tags.forEach((tag) => {
      db.prepare('INSERT INTO event_tags (event_id, tag, created_at) VALUES (?, ?, ?)').run(id, tag, nowIso());
    });

    db.prepare('DELETE FROM event_media WHERE event_id = ?').run(id);
    input.galleryMediaIds.forEach((mediaId, index) => {
      db.prepare(
        `INSERT INTO event_media (event_id, media_asset_id, sort_order, created_at)
         VALUES (?, ?, ?, ?)`
      ).run(id, mediaId, index, nowIso());
    });

    return getEventBySlug(input.slug);
  });
