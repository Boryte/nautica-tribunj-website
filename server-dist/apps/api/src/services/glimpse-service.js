"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.upsertGlimpseSlide = exports.upsertGlimpseGroup = exports.listGlimpseGroups = void 0;
const src_1 = require("../../../../packages/shared/src");
const db_1 = require("../db");
const time_1 = require("../utils/time");
const media_service_1 = require("./media-service");
const mapSlide = (row) => {
    const localizations = db_1.db.prepare(`SELECT locale, headline, body, cta_label as ctaLabel
     FROM glimpse_slide_localizations
     WHERE slide_id = ?`).all(row.id);
    const hr = localizations.find((entry) => entry.locale === src_1.DEFAULT_LOCALE) ?? { headline: '', body: '', ctaLabel: '' };
    return {
        id: row.id,
        groupId: row.group_id,
        mediaType: row.media_type,
        mediaAssetId: row.media_asset_id,
        mediaUrl: row.mediaStoragePath ? (0, media_service_1.resolveMediaPublicUrl)(row.mediaStoragePath) : null,
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
const listSlidesForGroup = (groupId) => db_1.db.prepare(`SELECT glimpse_slides.*, media_assets.storage_path as mediaStoragePath
       FROM glimpse_slides
       LEFT JOIN media_assets ON media_assets.id = glimpse_slides.media_asset_id
       WHERE glimpse_slides.group_id = ?
       ORDER BY glimpse_slides.sort_order ASC, glimpse_slides.id ASC`).all(groupId).map(mapSlide);
const mapGroup = (row) => {
    const localizations = db_1.db.prepare(`SELECT locale, label, title
     FROM glimpse_group_localizations
     WHERE group_id = ?`).all(row.id);
    const hr = localizations.find((entry) => entry.locale === src_1.DEFAULT_LOCALE) ?? { label: '', title: '' };
    return {
        id: row.id,
        active: Boolean(row.active),
        sortOrder: row.sort_order,
        coverMediaId: row.cover_media_id,
        coverImageUrl: row.coverStoragePath ? (0, media_service_1.resolveMediaPublicUrl)(row.coverStoragePath) : null,
        localizations: {
            hr,
            en: localizations.find((entry) => entry.locale === 'en') ?? hr,
        },
        slides: listSlidesForGroup(row.id),
    };
};
const listGlimpseGroups = (activeOnly = false) => db_1.db.prepare(`SELECT glimpse_groups.*, media_assets.storage_path as coverStoragePath
       FROM glimpse_groups
       LEFT JOIN media_assets ON media_assets.id = glimpse_groups.cover_media_id
       ${activeOnly ? 'WHERE glimpse_groups.active = 1' : ''}
       ORDER BY glimpse_groups.sort_order ASC, glimpse_groups.id ASC`).all().map(mapGroup);
exports.listGlimpseGroups = listGlimpseGroups;
const upsertGlimpseGroup = (input) => (0, db_1.runInTransaction)(() => {
    const id = input.id ??
        Number(db_1.db
            .prepare(`INSERT INTO glimpse_groups (active, sort_order, cover_media_id, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?)`)
            .run(input.active ? 1 : 0, input.sortOrder, input.coverMediaId, (0, time_1.nowIso)(), (0, time_1.nowIso)()).lastInsertRowid);
    if (input.id) {
        db_1.db.prepare(`UPDATE glimpse_groups
         SET active = ?, sort_order = ?, cover_media_id = ?, updated_at = ?
         WHERE id = ?`).run(input.active ? 1 : 0, input.sortOrder, input.coverMediaId, (0, time_1.nowIso)(), input.id);
    }
    for (const locale of ['hr', 'en']) {
        db_1.db.prepare(`INSERT INTO glimpse_group_localizations (group_id, locale, label, title, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT(group_id, locale) DO UPDATE SET label = excluded.label, title = excluded.title, updated_at = excluded.updated_at`).run(id, locale, input.localizations[locale].label, input.localizations[locale].title, (0, time_1.nowIso)(), (0, time_1.nowIso)());
    }
    return (0, exports.listGlimpseGroups)(false).find((group) => group.id === id);
});
exports.upsertGlimpseGroup = upsertGlimpseGroup;
const upsertGlimpseSlide = (input) => (0, db_1.runInTransaction)(() => {
    const id = input.id ??
        Number(db_1.db
            .prepare(`INSERT INTO glimpse_slides (group_id, media_type, media_asset_id, duration_ms, overlay_intensity, text_alignment, sort_order, cta_url, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
            .run(input.groupId, input.mediaType, input.mediaAssetId, input.durationMs, input.overlayIntensity, input.textAlignment, input.sortOrder, input.ctaUrl, (0, time_1.nowIso)(), (0, time_1.nowIso)()).lastInsertRowid);
    if (input.id) {
        db_1.db.prepare(`UPDATE glimpse_slides
         SET group_id = ?, media_type = ?, media_asset_id = ?, duration_ms = ?, overlay_intensity = ?, text_alignment = ?, sort_order = ?, cta_url = ?, updated_at = ?
         WHERE id = ?`).run(input.groupId, input.mediaType, input.mediaAssetId, input.durationMs, input.overlayIntensity, input.textAlignment, input.sortOrder, input.ctaUrl, (0, time_1.nowIso)(), input.id);
    }
    for (const locale of ['hr', 'en']) {
        db_1.db.prepare(`INSERT INTO glimpse_slide_localizations (slide_id, locale, headline, body, cta_label, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(slide_id, locale) DO UPDATE SET headline = excluded.headline, body = excluded.body, cta_label = excluded.cta_label, updated_at = excluded.updated_at`).run(id, locale, input.localizations[locale].headline, input.localizations[locale].body, input.localizations[locale].ctaLabel, (0, time_1.nowIso)(), (0, time_1.nowIso)());
    }
    const row = db_1.db.prepare(`SELECT glimpse_slides.*, media_assets.storage_path as mediaStoragePath
       FROM glimpse_slides
       LEFT JOIN media_assets ON media_assets.id = glimpse_slides.media_asset_id
       WHERE glimpse_slides.id = ?`).get(id);
    return mapSlide(row);
});
exports.upsertGlimpseSlide = upsertGlimpseSlide;
