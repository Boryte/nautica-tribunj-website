import fs from 'node:fs';
import path from 'node:path';
import type { MediaAssetDTO, MediaAssetUpsertInput, LocaleCode } from '../../../../packages/shared/src';
import { env } from '../config';
import { db, runInTransaction } from '../db';
import { paginateItems, type AdminListQuery } from '../utils/admin-query';
import { AppError } from '../utils/errors';
import { nowIso } from '../utils/time';

type MediaRow = {
  id: number;
  filename: string;
  original_filename: string;
  storage_path: string;
  mime_type: string;
  size_bytes: number;
  width: number | null;
  height: number | null;
  status: MediaAssetDTO['status'];
  featured: number;
  tags_json: string;
  focal_point_x: number | null;
  focal_point_y: number | null;
};

const getMediaAssetType = (mimeType: string): MediaAssetDTO['mediaType'] =>
  mimeType.startsWith('video/') ? 'video' : 'image';

const parseJsonArray = (value: string | null | undefined): string[] => {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((entry): entry is string => typeof entry === 'string') : [];
  } catch {
    return [];
  }
};

const siteMediaDirectory = path.resolve(process.cwd(), 'public', 'site-media');
const bundledDistSiteMediaDirectory = path.resolve(process.cwd(), 'dist', 'site-media');

const isWithinDirectory = (targetPath: string, directoryPath: string) => {
  const relativePath = path.relative(directoryPath, targetPath);
  return Boolean(relativePath) && !relativePath.startsWith('..') && !path.isAbsolute(relativePath);
};

export const resolveMediaPublicUrl = (storagePath: string) => {
  const filename = path.basename(storagePath);
  const normalizedStoragePath = path.resolve(storagePath);

  if (isWithinDirectory(normalizedStoragePath, siteMediaDirectory) || fs.existsSync(path.resolve(siteMediaDirectory, filename))) {
    return `/site-media/${filename}`;
  }

  const uploadPath = path.resolve(env.MEDIA_UPLOAD_DIR, filename);
  if (fs.existsSync(uploadPath)) {
    return `/uploads/${filename}`;
  }

  const bundledFallbackPath = path.resolve(bundledDistSiteMediaDirectory, filename);
  if (fs.existsSync(bundledFallbackPath)) {
    return `/site-media/${filename}`;
  }

  return `/uploads/${filename}`;
};

export const resolveLegacyMediaUrl = (value: string | null) => {
  if (!value?.startsWith('/uploads/')) return value;

  const filename = path.basename(value);
  return resolveMediaPublicUrl(path.resolve(env.MEDIA_UPLOAD_DIR, filename));
};

export const ensureMediaDirectory = () => {
  fs.mkdirSync(env.MEDIA_UPLOAD_DIR, { recursive: true });
};

const getMediaCollections = (mediaAssetId: number) =>
  (
    db.prepare(
      `SELECT media_collections.slug
       FROM media_collection_items
       INNER JOIN media_collections ON media_collections.id = media_collection_items.collection_id
       WHERE media_collection_items.media_asset_id = ?
       ORDER BY media_collections.sort_order, media_collections.slug`
    ).all(mediaAssetId) as Array<{ slug: string }>
  ).map((row) => row.slug);

export const mapMediaAsset = (row: MediaRow): MediaAssetDTO => {
  const localizations = db.prepare(
    `SELECT locale, alt_text as alt, caption
     FROM media_asset_localizations
     WHERE media_asset_id = ?`
  ).all(row.id) as Array<{ locale: LocaleCode; alt: string; caption: string }>;

  return {
    id: row.id,
    filename: row.filename,
    originalFilename: row.original_filename,
    mimeType: row.mime_type,
    mediaType: getMediaAssetType(row.mime_type),
    sizeBytes: row.size_bytes,
    width: row.width,
    height: row.height,
    url: resolveMediaPublicUrl(row.storage_path),
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

export const listMediaAssets = (options?: { readyOnly?: boolean }): MediaAssetDTO[] =>
  (db
    .prepare(`SELECT * FROM media_assets ${options?.readyOnly ? "WHERE status = 'ready'" : ''} ORDER BY featured DESC, created_at DESC`)
    .all() as MediaRow[]).map(mapMediaAsset);

export const listMediaAssetsPaginated = (query: AdminListQuery) => {
  const normalizedSearch = query.search.toLowerCase();
  const items = listMediaAssets().filter((asset) =>
    !normalizedSearch ||
    asset.originalFilename.toLowerCase().includes(normalizedSearch) ||
    asset.localizations.hr.alt.toLowerCase().includes(normalizedSearch) ||
    asset.localizations.en.alt.toLowerCase().includes(normalizedSearch) ||
    asset.tags.join(' ').toLowerCase().includes(normalizedSearch) ||
    asset.collections.join(' ').toLowerCase().includes(normalizedSearch)
  );
  return paginateItems(items, query.page, query.pageSize);
};

export const getMediaAsset = (id: number): MediaAssetDTO => {
  const row = db.prepare('SELECT * FROM media_assets WHERE id = ?').get(id) as MediaRow | undefined;
  if (!row) throw new AppError(404, 'MEDIA_NOT_FOUND', 'Media asset not found');
  return mapMediaAsset(row);
};

const upsertMediaCollections = (mediaAssetId: number, collections: string[]) => {
  db.prepare('DELETE FROM media_collection_items WHERE media_asset_id = ?').run(mediaAssetId);
  collections.forEach((slug, index) => {
    const collection = db.prepare('SELECT id FROM media_collections WHERE slug = ?').get(slug) as { id: number } | undefined;
    if (!collection) return;
    db.prepare(
      `INSERT INTO media_collection_items (collection_id, media_asset_id, sort_order, created_at)
       VALUES (?, ?, ?, ?)`
    ).run(collection.id, mediaAssetId, index, nowIso());
  });
};

export const upsertMediaAssetMetadata = (input: MediaAssetUpsertInput, mediaAssetId: number) =>
  runInTransaction(() => {
    const existing = db.prepare('SELECT * FROM media_assets WHERE id = ?').get(mediaAssetId) as MediaRow | undefined;
    if (!existing) throw new AppError(404, 'MEDIA_NOT_FOUND', 'Media asset not found');

    db.prepare(
      `UPDATE media_assets
       SET status = ?, featured = ?, tags_json = ?, focal_point_x = ?, focal_point_y = ?, updated_at = ?
       WHERE id = ?`
    ).run(
      input.status,
      input.featured ? 1 : 0,
      JSON.stringify(input.tags),
      input.focalPointX,
      input.focalPointY,
      nowIso(),
      mediaAssetId
    );

    for (const locale of ['hr', 'en'] as const) {
      db.prepare(
        `INSERT INTO media_asset_localizations (media_asset_id, locale, alt_text, caption, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT(media_asset_id, locale) DO UPDATE SET alt_text = excluded.alt_text, caption = excluded.caption, updated_at = excluded.updated_at`
      ).run(mediaAssetId, locale, input.localizations[locale].alt, input.localizations[locale].caption, nowIso(), nowIso());
    }

    upsertMediaCollections(mediaAssetId, input.collections);
    return getMediaAsset(mediaAssetId);
  });

export const createMediaAsset = (file: Express.Multer.File) => {
  ensureMediaDirectory();
  const id = Number(
    db
      .prepare(
        `INSERT INTO media_assets
         (filename, original_filename, storage_path, mime_type, size_bytes, width, height, status, featured, tags_json, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, NULL, NULL, 'ready', 0, '[]', ?, ?)`
      )
      .run(file.filename, file.originalname, file.path, file.mimetype, file.size, nowIso(), nowIso()).lastInsertRowid
  );

  for (const locale of ['hr', 'en'] as const) {
    db.prepare(
      `INSERT INTO media_asset_localizations (media_asset_id, locale, alt_text, caption, created_at, updated_at)
       VALUES (?, ?, ?, '', ?, ?)`
    ).run(id, locale, locale === 'hr' ? 'Nautica medij' : 'Nautica media', nowIso(), nowIso());
  }

  return getMediaAsset(id);
};

const mediaReferenceChecks = [
  { table: 'events', column: 'poster_media_id' },
  { table: 'menu_items', column: 'media_asset_id' },
  { table: 'glimpse_groups', column: 'cover_media_id' },
  { table: 'glimpse_slides', column: 'media_asset_id' },
  { table: 'event_media', column: 'media_asset_id' },
  { table: 'media_collection_items', column: 'media_asset_id' },
];

export const deleteMediaAsset = (mediaAssetId: number) =>
  runInTransaction(() => {
    const row = db.prepare('SELECT * FROM media_assets WHERE id = ?').get(mediaAssetId) as MediaRow | undefined;
    if (!row) throw new AppError(404, 'MEDIA_NOT_FOUND', 'Media asset not found');

    for (const check of mediaReferenceChecks) {
      const reference = db.prepare(`SELECT id FROM ${check.table} WHERE ${check.column} = ? LIMIT 1`).get(mediaAssetId) as { id: number } | undefined;
      if (reference) {
        throw new AppError(409, 'MEDIA_IN_USE', 'Media asset is still referenced and cannot be deleted');
      }
    }

    db.prepare('DELETE FROM media_assets WHERE id = ?').run(mediaAssetId);
    if (fs.existsSync(row.storage_path)) fs.unlinkSync(row.storage_path);
  });

export const listGalleryCollections = (options?: { readyOnly?: boolean }) =>
  (
    db.prepare('SELECT id, slug, name, sort_order as sortOrder FROM media_collections ORDER BY sort_order, slug').all() as Array<{
      id: number;
      slug: string;
      name: string;
      sortOrder: number;
    }>
  ).map((collection) => ({
    ...collection,
    items: (
      db.prepare(
        `SELECT media_assets.*
         FROM media_collection_items
         INNER JOIN media_assets ON media_assets.id = media_collection_items.media_asset_id
         WHERE media_collection_items.collection_id = ?
           AND (? = 0 OR media_assets.status = 'ready')
         ORDER BY media_collection_items.sort_order, media_assets.created_at DESC`
      ).all(collection.id, options?.readyOnly ? 1 : 0) as MediaRow[]
    ).map(mapMediaAsset),
  }));
