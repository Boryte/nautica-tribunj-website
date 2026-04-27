import type {
  GlimpseGroupDTO,
  GlimpseGroupUpsertInput,
  GlimpseSlideDTO,
  GlimpseSlideUpsertInput,
  LocaleCode,
} from '../../../../packages/shared/src';
import { DEFAULT_LOCALE } from '../../../../packages/shared/src';
import { db, runInTransaction } from '../db';
import { nowIso } from '../utils/time';
import { resolveMediaPublicUrl } from './media-service';

type GlimpseGroupRow = {
  id: number;
  active: number;
  sort_order: number;
  cover_media_id: number | null;
  coverStoragePath: string | null;
};

type GlimpseSlideRow = {
  id: number;
  group_id: number;
  media_type: GlimpseSlideDTO['mediaType'];
  media_asset_id: number | null;
  mediaStoragePath: string | null;
  duration_ms: number;
  overlay_intensity: number;
  text_alignment: GlimpseSlideDTO['textAlignment'];
  sort_order: number;
  cta_url: string | null;
};

const mapSlide = (row: GlimpseSlideRow): GlimpseSlideDTO => {
  const localizations = db.prepare(
    `SELECT locale, headline, body, cta_label as ctaLabel
     FROM glimpse_slide_localizations
     WHERE slide_id = ?`
  ).all(row.id) as Array<{ locale: LocaleCode; headline: string; body: string; ctaLabel: string }>;

  const hr = localizations.find((entry) => entry.locale === DEFAULT_LOCALE) ?? { headline: '', body: '', ctaLabel: '' };

  return {
    id: row.id,
    groupId: row.group_id,
    mediaType: row.media_type,
    mediaAssetId: row.media_asset_id,
    mediaUrl: row.mediaStoragePath ? resolveMediaPublicUrl(row.mediaStoragePath) : null,
    durationMs: row.duration_ms,
    overlayIntensity: row.overlay_intensity,
    textAlignment: row.text_alignment,
    sortOrder: row.sort_order,
    ctaUrl: row.cta_url,
    localizations: {
      hr,
      en: localizations.find((entry) => entry.locale === 'en') ?? hr,
    },
  };
};

const listSlidesForGroup = (groupId: number) =>
  (
    db.prepare(
      `SELECT glimpse_slides.*, media_assets.storage_path as mediaStoragePath
       FROM glimpse_slides
       LEFT JOIN media_assets ON media_assets.id = glimpse_slides.media_asset_id
       WHERE glimpse_slides.group_id = ?
       ORDER BY glimpse_slides.sort_order ASC, glimpse_slides.id ASC`
    ).all(groupId) as GlimpseSlideRow[]
  ).map(mapSlide);

const mapGroup = (row: GlimpseGroupRow): GlimpseGroupDTO => {
  const localizations = db.prepare(
    `SELECT locale, label, title
     FROM glimpse_group_localizations
     WHERE group_id = ?`
  ).all(row.id) as Array<{ locale: LocaleCode; label: string; title: string }>;

  const hr = localizations.find((entry) => entry.locale === DEFAULT_LOCALE) ?? { label: '', title: '' };

  return {
    id: row.id,
    active: Boolean(row.active),
    sortOrder: row.sort_order,
    coverMediaId: row.cover_media_id,
    coverImageUrl: row.coverStoragePath ? resolveMediaPublicUrl(row.coverStoragePath) : null,
    localizations: {
      hr,
      en: localizations.find((entry) => entry.locale === 'en') ?? hr,
    },
    slides: listSlidesForGroup(row.id),
  };
};

export const listGlimpseGroups = (activeOnly = false): GlimpseGroupDTO[] =>
  (
    db.prepare(
      `SELECT glimpse_groups.*, media_assets.storage_path as coverStoragePath
       FROM glimpse_groups
       LEFT JOIN media_assets ON media_assets.id = glimpse_groups.cover_media_id
       ${activeOnly ? 'WHERE glimpse_groups.active = 1' : ''}
       ORDER BY glimpse_groups.sort_order ASC, glimpse_groups.id ASC`
    ).all() as GlimpseGroupRow[]
  ).map(mapGroup);

export const upsertGlimpseGroup = (input: GlimpseGroupUpsertInput) =>
  runInTransaction(() => {
    const id =
      input.id ??
      Number(
        db
          .prepare(
            `INSERT INTO glimpse_groups (active, sort_order, cover_media_id, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?)`
          )
          .run(input.active ? 1 : 0, input.sortOrder, input.coverMediaId, nowIso(), nowIso()).lastInsertRowid
      );

    if (input.id) {
      db.prepare(
        `UPDATE glimpse_groups
         SET active = ?, sort_order = ?, cover_media_id = ?, updated_at = ?
         WHERE id = ?`
      ).run(input.active ? 1 : 0, input.sortOrder, input.coverMediaId, nowIso(), input.id);
    }

    for (const locale of ['hr', 'en'] as const) {
      db.prepare(
        `INSERT INTO glimpse_group_localizations (group_id, locale, label, title, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT(group_id, locale) DO UPDATE SET label = excluded.label, title = excluded.title, updated_at = excluded.updated_at`
      ).run(id, locale, input.localizations[locale].label, input.localizations[locale].title, nowIso(), nowIso());
    }

    return listGlimpseGroups(false).find((group) => group.id === id)!;
  });

export const upsertGlimpseSlide = (input: GlimpseSlideUpsertInput) =>
  runInTransaction(() => {
    const id =
      input.id ??
      Number(
        db
          .prepare(
            `INSERT INTO glimpse_slides (group_id, media_type, media_asset_id, duration_ms, overlay_intensity, text_alignment, sort_order, cta_url, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
          )
          .run(
            input.groupId,
            input.mediaType,
            input.mediaAssetId,
            input.durationMs,
            input.overlayIntensity,
            input.textAlignment,
            input.sortOrder,
            input.ctaUrl,
            nowIso(),
            nowIso()
          ).lastInsertRowid
      );

    if (input.id) {
      db.prepare(
        `UPDATE glimpse_slides
         SET group_id = ?, media_type = ?, media_asset_id = ?, duration_ms = ?, overlay_intensity = ?, text_alignment = ?, sort_order = ?, cta_url = ?, updated_at = ?
         WHERE id = ?`
      ).run(
        input.groupId,
        input.mediaType,
        input.mediaAssetId,
        input.durationMs,
        input.overlayIntensity,
        input.textAlignment,
        input.sortOrder,
        input.ctaUrl,
        nowIso(),
        input.id
      );
    }

    for (const locale of ['hr', 'en'] as const) {
      db.prepare(
        `INSERT INTO glimpse_slide_localizations (slide_id, locale, headline, body, cta_label, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(slide_id, locale) DO UPDATE SET headline = excluded.headline, body = excluded.body, cta_label = excluded.cta_label, updated_at = excluded.updated_at`
      ).run(id, locale, input.localizations[locale].headline, input.localizations[locale].body, input.localizations[locale].ctaLabel, nowIso(), nowIso());
    }

    const row = db.prepare(
      `SELECT glimpse_slides.*, media_assets.storage_path as mediaStoragePath
       FROM glimpse_slides
       LEFT JOIN media_assets ON media_assets.id = glimpse_slides.media_asset_id
       WHERE glimpse_slides.id = ?`
    ).get(id) as GlimpseSlideRow;

    return mapSlide(row);
  });
