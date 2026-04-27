"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAnnouncement = exports.upsertAnnouncement = exports.listActiveAnnouncements = exports.listAnnouncements = void 0;
const src_1 = require("../../../../packages/shared/src");
const db_1 = require("../db");
const errors_1 = require("../utils/errors");
const time_1 = require("../utils/time");
const mapAnnouncement = (row) => {
    const localizations = db_1.db.prepare(`SELECT locale, title, body, cta_label as ctaLabel
     FROM announcement_localizations
     WHERE announcement_id = ?`).all(row.id);
    const hr = localizations.find((entry) => entry.locale === src_1.DEFAULT_LOCALE) ?? { title: '', body: '', ctaLabel: '' };
    return {
        id: row.id,
        status: row.status,
        variant: row.variant,
        priority: row.priority,
        sortOrder: row.sort_order,
        dismissible: Boolean(row.dismissible),
        persistentDismissalKey: row.persistent_dismissal_key,
        ctaUrl: row.cta_url,
        eventId: row.event_id,
        reservationIntent: row.reservation_intent,
        startsAt: row.starts_at,
        endsAt: row.ends_at,
        localizations: {
            hr,
            en: localizations.find((entry) => entry.locale === 'en') ?? hr,
        },
    };
};
const listAnnouncements = () => db_1.db.prepare('SELECT * FROM announcements ORDER BY priority DESC, sort_order ASC, created_at DESC').all().map(mapAnnouncement);
exports.listAnnouncements = listAnnouncements;
const isWithinSchedule = (row) => {
    const now = new Date().toISOString();
    if (row.status === 'expired')
        return false;
    if (row.status === 'draft')
        return false;
    if (row.starts_at && row.starts_at > now)
        return false;
    if (row.ends_at && row.ends_at < now)
        return false;
    return true;
};
const listActiveAnnouncements = () => db_1.db.prepare(`SELECT * FROM announcements WHERE status IN ('scheduled', 'active') ORDER BY priority DESC, sort_order ASC`).all()
    .filter(isWithinSchedule)
    .map(mapAnnouncement);
exports.listActiveAnnouncements = listActiveAnnouncements;
const upsertAnnouncement = (input) => (0, db_1.runInTransaction)(() => {
    const id = input.id ??
        Number(db_1.db
            .prepare(`INSERT INTO announcements
             (status, variant, priority, sort_order, dismissible, persistent_dismissal_key, cta_url, event_id, reservation_intent, starts_at, ends_at, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
            .run(input.status, input.variant, input.priority, input.sortOrder, input.dismissible ? 1 : 0, input.persistentDismissalKey, input.ctaUrl, input.eventId, input.reservationIntent, input.startsAt, input.endsAt, (0, time_1.nowIso)(), (0, time_1.nowIso)()).lastInsertRowid);
    if (input.id) {
        db_1.db.prepare(`UPDATE announcements
         SET status = ?, variant = ?, priority = ?, sort_order = ?, dismissible = ?, persistent_dismissal_key = ?, cta_url = ?, event_id = ?, reservation_intent = ?, starts_at = ?, ends_at = ?, updated_at = ?
         WHERE id = ?`).run(input.status, input.variant, input.priority, input.sortOrder, input.dismissible ? 1 : 0, input.persistentDismissalKey, input.ctaUrl, input.eventId, input.reservationIntent, input.startsAt, input.endsAt, (0, time_1.nowIso)(), input.id);
    }
    for (const locale of ['hr', 'en']) {
        db_1.db.prepare(`INSERT INTO announcement_localizations (announcement_id, locale, title, body, cta_label, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(announcement_id, locale) DO UPDATE SET title = excluded.title, body = excluded.body, cta_label = excluded.cta_label, updated_at = excluded.updated_at`).run(id, locale, input.localizations[locale].title, input.localizations[locale].body, input.localizations[locale].ctaLabel, (0, time_1.nowIso)(), (0, time_1.nowIso)());
    }
    return mapAnnouncement(db_1.db.prepare('SELECT * FROM announcements WHERE id = ?').get(id));
});
exports.upsertAnnouncement = upsertAnnouncement;
const deleteAnnouncement = (announcementId) => (0, db_1.runInTransaction)(() => {
    const existing = db_1.db.prepare('SELECT id FROM announcements WHERE id = ?').get(announcementId);
    if (!existing)
        throw new errors_1.AppError(404, 'ANNOUNCEMENT_NOT_FOUND', 'Announcement not found');
    db_1.db.prepare('DELETE FROM announcements WHERE id = ?').run(announcementId);
    return { deleted: true };
});
exports.deleteAnnouncement = deleteAnnouncement;
