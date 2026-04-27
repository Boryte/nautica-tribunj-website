import type { AnnouncementDTO, AnnouncementStatus, AnnouncementUpsertInput, LocaleCode } from '../../../../packages/shared/src';
import { DEFAULT_LOCALE } from '../../../../packages/shared/src';
import { db, runInTransaction } from '../db';
import { AppError } from '../utils/errors';
import { nowIso } from '../utils/time';

type AnnouncementRow = {
  id: number;
  status: AnnouncementStatus;
  variant: AnnouncementDTO['variant'];
  priority: number;
  sort_order: number;
  dismissible: number;
  persistent_dismissal_key: string | null;
  cta_url: string | null;
  event_id: number | null;
  reservation_intent: AnnouncementDTO['reservationIntent'];
  starts_at: string | null;
  ends_at: string | null;
};

const mapAnnouncement = (row: AnnouncementRow): AnnouncementDTO => {
  const localizations = db.prepare(
    `SELECT locale, title, body, cta_label as ctaLabel
     FROM announcement_localizations
     WHERE announcement_id = ?`
  ).all(row.id) as Array<{ locale: LocaleCode; title: string; body: string; ctaLabel: string }>;

  const hr = localizations.find((entry) => entry.locale === DEFAULT_LOCALE) ?? { title: '', body: '', ctaLabel: '' };

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

export const listAnnouncements = (): AnnouncementDTO[] =>
  (db.prepare('SELECT * FROM announcements ORDER BY priority DESC, sort_order ASC, created_at DESC').all() as AnnouncementRow[]).map(mapAnnouncement);

const isWithinSchedule = (row: AnnouncementRow) => {
  const now = new Date().toISOString();
  if (row.status === 'expired') return false;
  if (row.status === 'draft') return false;
  if (row.starts_at && row.starts_at > now) return false;
  if (row.ends_at && row.ends_at < now) return false;
  return true;
};

export const listActiveAnnouncements = (): AnnouncementDTO[] =>
  (db.prepare(`SELECT * FROM announcements WHERE status IN ('scheduled', 'active') ORDER BY priority DESC, sort_order ASC`).all() as AnnouncementRow[])
    .filter(isWithinSchedule)
    .map(mapAnnouncement);

export const upsertAnnouncement = (input: AnnouncementUpsertInput) =>
  runInTransaction(() => {
    const id =
      input.id ??
      Number(
        db
          .prepare(
            `INSERT INTO announcements
             (status, variant, priority, sort_order, dismissible, persistent_dismissal_key, cta_url, event_id, reservation_intent, starts_at, ends_at, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
          )
          .run(
            input.status,
            input.variant,
            input.priority,
            input.sortOrder,
            input.dismissible ? 1 : 0,
            input.persistentDismissalKey,
            input.ctaUrl,
            input.eventId,
            input.reservationIntent,
            input.startsAt,
            input.endsAt,
            nowIso(),
            nowIso()
          ).lastInsertRowid
      );

    if (input.id) {
      db.prepare(
        `UPDATE announcements
         SET status = ?, variant = ?, priority = ?, sort_order = ?, dismissible = ?, persistent_dismissal_key = ?, cta_url = ?, event_id = ?, reservation_intent = ?, starts_at = ?, ends_at = ?, updated_at = ?
         WHERE id = ?`
      ).run(
        input.status,
        input.variant,
        input.priority,
        input.sortOrder,
        input.dismissible ? 1 : 0,
        input.persistentDismissalKey,
        input.ctaUrl,
        input.eventId,
        input.reservationIntent,
        input.startsAt,
        input.endsAt,
        nowIso(),
        input.id
      );
    }

    for (const locale of ['hr', 'en'] as const) {
      db.prepare(
        `INSERT INTO announcement_localizations (announcement_id, locale, title, body, cta_label, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(announcement_id, locale) DO UPDATE SET title = excluded.title, body = excluded.body, cta_label = excluded.cta_label, updated_at = excluded.updated_at`
      ).run(id, locale, input.localizations[locale].title, input.localizations[locale].body, input.localizations[locale].ctaLabel, nowIso(), nowIso());
    }

    return mapAnnouncement(db.prepare('SELECT * FROM announcements WHERE id = ?').get(id) as AnnouncementRow);
  });

export const deleteAnnouncement = (announcementId: number) =>
  runInTransaction(() => {
    const existing = db.prepare('SELECT id FROM announcements WHERE id = ?').get(announcementId) as { id: number } | undefined;
    if (!existing) throw new AppError(404, 'ANNOUNCEMENT_NOT_FOUND', 'Announcement not found');
    db.prepare('DELETE FROM announcements WHERE id = ?').run(announcementId);
    return { deleted: true };
  });
