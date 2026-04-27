"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.upsertEvent = exports.registerForEvent = exports.getEventBySlug = exports.listAllEventsPaginated = exports.listAllEvents = exports.listPublicEvents = void 0;
const db_1 = require("../db");
const admin_query_1 = require("../utils/admin-query");
const errors_1 = require("../utils/errors");
const time_1 = require("../utils/time");
const media_service_1 = require("./media-service");
const parseTags = (eventId) => db_1.db.prepare('SELECT tag FROM event_tags WHERE event_id = ? ORDER BY tag ASC').all(eventId).map((row) => row.tag);
const getGallery = (eventId) => db_1.db.prepare(`SELECT media_assets.*
       FROM event_media
       INNER JOIN media_assets ON media_assets.id = event_media.media_asset_id
       WHERE event_media.event_id = ?
       ORDER BY event_media.sort_order ASC, media_assets.created_at DESC`).all(eventId).map(media_service_1.mapMediaAsset);
const mapEvent = (row) => {
    const registrationsCount = Number(db_1.db.prepare(`SELECT COUNT(*) as count FROM event_registrations WHERE event_id = ? AND status = 'registered'`).get(row.id).count);
    const localizations = db_1.db.prepare(`SELECT locale, title, teaser, description
     FROM event_localizations
     WHERE event_id = ?`).all(row.id);
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
        imageUrl: (0, media_service_1.resolveLegacyMediaUrl)(row.image_url),
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
const listPublicEvents = () => db_1.db.prepare(`SELECT * FROM events WHERE status = 'published' ORDER BY featured DESC, starts_at ASC`).all().map(mapEvent);
exports.listPublicEvents = listPublicEvents;
const listAllEvents = () => db_1.db.prepare('SELECT * FROM events ORDER BY starts_at DESC').all().map(mapEvent);
exports.listAllEvents = listAllEvents;
const listAllEventsPaginated = (query) => {
    const normalizedSearch = query.search.toLowerCase();
    const items = (0, exports.listAllEvents)().filter((event) => (!query.status || event.status === query.status) &&
        (!normalizedSearch ||
            event.category.toLowerCase().includes(normalizedSearch) ||
            event.localizations.hr.title.toLowerCase().includes(normalizedSearch) ||
            event.localizations.en.title.toLowerCase().includes(normalizedSearch)));
    return (0, admin_query_1.paginateItems)(items, query.page, query.pageSize);
};
exports.listAllEventsPaginated = listAllEventsPaginated;
const getEventBySlug = (slug) => {
    const row = db_1.db.prepare('SELECT * FROM events WHERE slug = ?').get(slug);
    if (!row)
        throw new errors_1.AppError(404, 'EVENT_NOT_FOUND', 'Event not found');
    return mapEvent(row);
};
exports.getEventBySlug = getEventBySlug;
const registerForEvent = (eventId, input) => (0, db_1.runInTransaction)(() => {
    const row = db_1.db.prepare('SELECT * FROM events WHERE id = ?').get(eventId);
    if (!row || row.status !== 'published')
        throw new errors_1.AppError(404, 'EVENT_NOT_FOUND', 'Event not found');
    const event = mapEvent(row);
    const existing = db_1.db.prepare(`SELECT id FROM event_registrations
       WHERE event_id = ? AND attendee_email = ? AND status IN ('registered', 'waitlist')`).get(eventId, input.email);
    if (existing)
        throw new errors_1.AppError(409, 'EVENT_ALREADY_REGISTERED', 'This email is already registered for the event');
    const status = event.soldOut ? (event.waitlistEnabled ? 'waitlist' : null) : 'registered';
    if (!status)
        throw new errors_1.AppError(409, 'EVENT_SOLD_OUT', 'This event is sold out');
    db_1.db.prepare(`INSERT INTO event_registrations (event_id, status, attendee_name, attendee_email, attendee_phone, locale, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(eventId, status, input.name, input.email, input.phone, input.locale, (0, time_1.nowIso)(), (0, time_1.nowIso)());
    return { status };
});
exports.registerForEvent = registerForEvent;
const upsertEvent = (input, eventId) => (0, db_1.runInTransaction)(() => {
    const id = eventId ??
        Number(db_1.db
            .prepare(`INSERT INTO events
             (slug, status, featured, capacity, waitlist_enabled, starts_at, ends_at, image_url, poster_media_id, category, timezone, reservation_mode, price_label, ticket_url, linked_announcement_id, linked_glimpse_group_id, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
            .run(input.slug, input.status, input.featured ? 1 : 0, input.capacity, input.waitlistEnabled ? 1 : 0, input.startsAt, input.endsAt, input.imageUrl, input.posterMediaId, input.category, input.timezone, input.reservationMode, input.priceLabel, input.ticketUrl, input.linkedAnnouncementId, input.linkedGlimpseGroupId, (0, time_1.nowIso)(), (0, time_1.nowIso)()).lastInsertRowid);
    if (eventId) {
        db_1.db.prepare(`UPDATE events
         SET slug = ?, status = ?, featured = ?, capacity = ?, waitlist_enabled = ?, starts_at = ?, ends_at = ?, image_url = ?, poster_media_id = ?, category = ?, timezone = ?, reservation_mode = ?, price_label = ?, ticket_url = ?, linked_announcement_id = ?, linked_glimpse_group_id = ?, updated_at = ?
         WHERE id = ?`).run(input.slug, input.status, input.featured ? 1 : 0, input.capacity, input.waitlistEnabled ? 1 : 0, input.startsAt, input.endsAt, input.imageUrl, input.posterMediaId, input.category, input.timezone, input.reservationMode, input.priceLabel, input.ticketUrl, input.linkedAnnouncementId, input.linkedGlimpseGroupId, (0, time_1.nowIso)(), eventId);
    }
    for (const locale of ['hr', 'en']) {
        db_1.db.prepare(`INSERT INTO event_localizations (event_id, locale, title, teaser, description, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(event_id, locale) DO UPDATE SET title = excluded.title, teaser = excluded.teaser, description = excluded.description, updated_at = excluded.updated_at`).run(id, locale, input.localizations[locale].title, input.localizations[locale].teaser, input.localizations[locale].description, (0, time_1.nowIso)(), (0, time_1.nowIso)());
    }
    db_1.db.prepare('DELETE FROM event_tags WHERE event_id = ?').run(id);
    input.tags.forEach((tag) => {
        db_1.db.prepare('INSERT INTO event_tags (event_id, tag, created_at) VALUES (?, ?, ?)').run(id, tag, (0, time_1.nowIso)());
    });
    db_1.db.prepare('DELETE FROM event_media WHERE event_id = ?').run(id);
    input.galleryMediaIds.forEach((mediaId, index) => {
        db_1.db.prepare(`INSERT INTO event_media (event_id, media_asset_id, sort_order, created_at)
         VALUES (?, ?, ?, ?)`).run(id, mediaId, index, (0, time_1.nowIso)());
    });
    return (0, exports.getEventBySlug)(input.slug);
});
exports.upsertEvent = upsertEvent;
