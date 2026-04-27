"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listGalleryCollections = exports.deleteMediaAsset = exports.createMediaAsset = exports.upsertMediaAssetMetadata = exports.getMediaAsset = exports.listMediaAssetsPaginated = exports.listMediaAssets = exports.mapMediaAsset = exports.ensureMediaDirectory = exports.resolveLegacyMediaUrl = exports.resolveMediaPublicUrl = void 0;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const config_1 = require("../config");
const db_1 = require("../db");
const admin_query_1 = require("../utils/admin-query");
const errors_1 = require("../utils/errors");
const time_1 = require("../utils/time");
const getMediaAssetType = (mimeType) => mimeType.startsWith('video/') ? 'video' : 'image';
const parseJsonArray = (value) => {
    if (!value)
        return [];
    try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed.filter((entry) => typeof entry === 'string') : [];
    }
    catch {
        return [];
    }
};
const siteMediaDirectory = node_path_1.default.resolve(process.cwd(), 'public', 'site-media');
const bundledDistSiteMediaDirectory = node_path_1.default.resolve(process.cwd(), 'dist', 'site-media');
const isWithinDirectory = (targetPath, directoryPath) => {
    const relativePath = node_path_1.default.relative(directoryPath, targetPath);
    return Boolean(relativePath) && !relativePath.startsWith('..') && !node_path_1.default.isAbsolute(relativePath);
};
const resolveMediaPublicUrl = (storagePath) => {
    const filename = node_path_1.default.basename(storagePath);
    const normalizedStoragePath = node_path_1.default.resolve(storagePath);
    if (isWithinDirectory(normalizedStoragePath, siteMediaDirectory) || node_fs_1.default.existsSync(node_path_1.default.resolve(siteMediaDirectory, filename))) {
        return `/site-media/${filename}`;
    }
    const uploadPath = node_path_1.default.resolve(config_1.env.MEDIA_UPLOAD_DIR, filename);
    if (node_fs_1.default.existsSync(uploadPath)) {
        return `/uploads/${filename}`;
    }
    const bundledFallbackPath = node_path_1.default.resolve(bundledDistSiteMediaDirectory, filename);
    if (node_fs_1.default.existsSync(bundledFallbackPath)) {
        return `/site-media/${filename}`;
    }
    return `/uploads/${filename}`;
};
exports.resolveMediaPublicUrl = resolveMediaPublicUrl;
const resolveLegacyMediaUrl = (value) => {
    if (!value?.startsWith('/uploads/'))
        return value;
    const filename = node_path_1.default.basename(value);
    return (0, exports.resolveMediaPublicUrl)(node_path_1.default.resolve(config_1.env.MEDIA_UPLOAD_DIR, filename));
};
exports.resolveLegacyMediaUrl = resolveLegacyMediaUrl;
const ensureMediaDirectory = () => {
    node_fs_1.default.mkdirSync(config_1.env.MEDIA_UPLOAD_DIR, { recursive: true });
};
exports.ensureMediaDirectory = ensureMediaDirectory;
const getMediaCollections = (mediaAssetId) => db_1.db.prepare(`SELECT media_collections.slug
       FROM media_collection_items
       INNER JOIN media_collections ON media_collections.id = media_collection_items.collection_id
       WHERE media_collection_items.media_asset_id = ?
       ORDER BY media_collections.sort_order, media_collections.slug`).all(mediaAssetId).map((row) => row.slug);
const mapMediaAsset = (row) => {
    const localizations = db_1.db.prepare(`SELECT locale, alt_text as alt, caption
     FROM media_asset_localizations
     WHERE media_asset_id = ?`).all(row.id);
    return {
        id: row.id,
        filename: row.filename,
        originalFilename: row.original_filename,
        mimeType: row.mime_type,
        mediaType: getMediaAssetType(row.mime_type),
        sizeBytes: row.size_bytes,
        width: row.width,
        height: row.height,
        url: (0, exports.resolveMediaPublicUrl)(row.storage_path),
        status: row.status,
        featured: Boolean(row.featured),
        tags: parseJsonArray(row.tags_json),
        collections: getMediaCollections(row.id),
        focalPointX: row.focal_point_x,
        focalPointY: row.focal_point_y,
        localizations: {
            hr: localizations.find((entry) => entry.locale === 'hr') ?? { alt: 'Nautica media', caption: '' },
            en: localizations.find((entry) => entry.locale === 'en') ?? { alt: 'Nautica media', caption: '' },
        },
    };
};
exports.mapMediaAsset = mapMediaAsset;
const listMediaAssets = (options) => db_1.db
    .prepare(`SELECT * FROM media_assets ${options?.readyOnly ? "WHERE status = 'ready'" : ''} ORDER BY featured DESC, created_at DESC`)
    .all().map(exports.mapMediaAsset);
exports.listMediaAssets = listMediaAssets;
const listMediaAssetsPaginated = (query) => {
    const normalizedSearch = query.search.toLowerCase();
    const items = (0, exports.listMediaAssets)().filter((asset) => !normalizedSearch ||
        asset.originalFilename.toLowerCase().includes(normalizedSearch) ||
        asset.localizations.hr.alt.toLowerCase().includes(normalizedSearch) ||
        asset.localizations.en.alt.toLowerCase().includes(normalizedSearch) ||
        asset.tags.join(' ').toLowerCase().includes(normalizedSearch) ||
        asset.collections.join(' ').toLowerCase().includes(normalizedSearch));
    return (0, admin_query_1.paginateItems)(items, query.page, query.pageSize);
};
exports.listMediaAssetsPaginated = listMediaAssetsPaginated;
const getMediaAsset = (id) => {
    const row = db_1.db.prepare('SELECT * FROM media_assets WHERE id = ?').get(id);
    if (!row)
        throw new errors_1.AppError(404, 'MEDIA_NOT_FOUND', 'Media asset not found');
    return (0, exports.mapMediaAsset)(row);
};
exports.getMediaAsset = getMediaAsset;
const upsertMediaCollections = (mediaAssetId, collections) => {
    db_1.db.prepare('DELETE FROM media_collection_items WHERE media_asset_id = ?').run(mediaAssetId);
    collections.forEach((slug, index) => {
        const collection = db_1.db.prepare('SELECT id FROM media_collections WHERE slug = ?').get(slug);
        if (!collection)
            return;
        db_1.db.prepare(`INSERT INTO media_collection_items (collection_id, media_asset_id, sort_order, created_at)
       VALUES (?, ?, ?, ?)`).run(collection.id, mediaAssetId, index, (0, time_1.nowIso)());
    });
};
const upsertMediaAssetMetadata = (input, mediaAssetId) => (0, db_1.runInTransaction)(() => {
    const existing = db_1.db.prepare('SELECT * FROM media_assets WHERE id = ?').get(mediaAssetId);
    if (!existing)
        throw new errors_1.AppError(404, 'MEDIA_NOT_FOUND', 'Media asset not found');
    db_1.db.prepare(`UPDATE media_assets
       SET status = ?, featured = ?, tags_json = ?, focal_point_x = ?, focal_point_y = ?, updated_at = ?
       WHERE id = ?`).run(input.status, input.featured ? 1 : 0, JSON.stringify(input.tags), input.focalPointX, input.focalPointY, (0, time_1.nowIso)(), mediaAssetId);
    for (const locale of ['hr', 'en']) {
        db_1.db.prepare(`INSERT INTO media_asset_localizations (media_asset_id, locale, alt_text, caption, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT(media_asset_id, locale) DO UPDATE SET alt_text = excluded.alt_text, caption = excluded.caption, updated_at = excluded.updated_at`).run(mediaAssetId, locale, input.localizations[locale].alt, input.localizations[locale].caption, (0, time_1.nowIso)(), (0, time_1.nowIso)());
    }
    upsertMediaCollections(mediaAssetId, input.collections);
    return (0, exports.getMediaAsset)(mediaAssetId);
});
exports.upsertMediaAssetMetadata = upsertMediaAssetMetadata;
const createMediaAsset = (file) => {
    (0, exports.ensureMediaDirectory)();
    const id = Number(db_1.db
        .prepare(`INSERT INTO media_assets
         (filename, original_filename, storage_path, mime_type, size_bytes, width, height, status, featured, tags_json, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, NULL, NULL, 'ready', 0, '[]', ?, ?)`)
        .run(file.filename, file.originalname, file.path, file.mimetype, file.size, (0, time_1.nowIso)(), (0, time_1.nowIso)()).lastInsertRowid);
    for (const locale of ['hr', 'en']) {
        db_1.db.prepare(`INSERT INTO media_asset_localizations (media_asset_id, locale, alt_text, caption, created_at, updated_at)
       VALUES (?, ?, ?, '', ?, ?)`).run(id, locale, locale === 'hr' ? 'Nautica medij' : 'Nautica media', (0, time_1.nowIso)(), (0, time_1.nowIso)());
    }
    return (0, exports.getMediaAsset)(id);
};
exports.createMediaAsset = createMediaAsset;
const mediaReferenceChecks = [
    { table: 'events', column: 'poster_media_id' },
    { table: 'menu_items', column: 'media_asset_id' },
    { table: 'glimpse_groups', column: 'cover_media_id' },
    { table: 'glimpse_slides', column: 'media_asset_id' },
    { table: 'event_media', column: 'media_asset_id' },
    { table: 'media_collection_items', column: 'media_asset_id' },
];
const deleteMediaAsset = (mediaAssetId) => (0, db_1.runInTransaction)(() => {
    const row = db_1.db.prepare('SELECT * FROM media_assets WHERE id = ?').get(mediaAssetId);
    if (!row)
        throw new errors_1.AppError(404, 'MEDIA_NOT_FOUND', 'Media asset not found');
    for (const check of mediaReferenceChecks) {
        const reference = db_1.db.prepare(`SELECT id FROM ${check.table} WHERE ${check.column} = ? LIMIT 1`).get(mediaAssetId);
        if (reference) {
            throw new errors_1.AppError(409, 'MEDIA_IN_USE', 'Media asset is still referenced and cannot be deleted');
        }
    }
    db_1.db.prepare('DELETE FROM media_assets WHERE id = ?').run(mediaAssetId);
    if (node_fs_1.default.existsSync(row.storage_path))
        node_fs_1.default.unlinkSync(row.storage_path);
});
exports.deleteMediaAsset = deleteMediaAsset;
const listGalleryCollections = (options) => db_1.db.prepare('SELECT id, slug, name, sort_order as sortOrder FROM media_collections ORDER BY sort_order, slug').all().map((collection) => ({
    ...collection,
    items: db_1.db.prepare(`SELECT media_assets.*
         FROM media_collection_items
         INNER JOIN media_assets ON media_assets.id = media_collection_items.media_asset_id
         WHERE media_collection_items.collection_id = ?
           AND (? = 0 OR media_assets.status = 'ready')
         ORDER BY media_collection_items.sort_order, media_assets.created_at DESC`).all(collection.id, options?.readyOnly ? 1 : 0).map(exports.mapMediaAsset),
}));
exports.listGalleryCollections = listGalleryCollections;
