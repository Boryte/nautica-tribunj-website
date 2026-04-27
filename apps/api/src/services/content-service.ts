import type {
  BootstrapPayload,
  ContentEntryDTO,
  HomepageModuleDTO,
  HomepageModuleUpsertInput,
  LocaleCode,
  MenuCategory,
  MenuItemDTO,
  MenuItemUpsertInput,
  SiteSettingsDTO,
} from '../../../../packages/shared/src';
import { DEFAULT_LOCALE, menuCategories } from '../../../../packages/shared/src';
import { db, runInTransaction } from '../db';
import { nowIso } from '../utils/time';
import { listActiveAnnouncements } from './announcement-service';
import { listGlimpseGroups } from './glimpse-service';
import { listGalleryCollections, resolveMediaPublicUrl } from './media-service';
import { paginateItems, type AdminListQuery } from '../utils/admin-query';

const menuCategoryOrder = menuCategories;

const menuCategoryOrderIndex = new Map<MenuCategory, number>(menuCategoryOrder.map((category, index) => [category, index]));

const getSettings = (): SiteSettingsDTO => {
  const row = db.prepare(
    `SELECT business_name as businessName, timezone, phone, whatsapp_phone as whatsappPhone, email, address, city
     FROM business_settings WHERE id = 1`
  ).get() as SiteSettingsDTO | undefined;

  return (
    row ?? {
      businessName: 'Nautica',
      timezone: 'Europe/Zagreb',
      phone: '',
      whatsappPhone: '',
      email: '',
      address: '',
      city: '',
    }
  );
};

export const getBusinessSettings = () => getSettings();

const parseArray = (value: string | null | undefined) => {
  if (!value) return [] as string[];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((entry): entry is string => typeof entry === 'string') : [];
  } catch {
    return [] as string[];
  }
};

export const listContentEntries = (): ContentEntryDTO[] =>
  db.prepare(
    `SELECT id, scope, content_key as contentKey, locale, value, updated_at as updatedAt
     FROM localized_content
     ORDER BY scope, content_key, locale`
  ).all() as ContentEntryDTO[];

export const listContentEntriesPaginated = (query: AdminListQuery) => {
  const normalizedSearch = query.search.toLowerCase();
  const items = listContentEntries().filter((entry) =>
    !normalizedSearch ||
    entry.scope.toLowerCase().includes(normalizedSearch) ||
    entry.contentKey.toLowerCase().includes(normalizedSearch) ||
    entry.value.toLowerCase().includes(normalizedSearch)
  );
  return paginateItems(items, query.page, query.pageSize);
};

export const upsertContentEntry = (input: { scope: string; contentKey: string; locale: LocaleCode; value: string }) => {
  db.prepare(
    `INSERT INTO localized_content (scope, content_key, locale, value, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(scope, content_key, locale) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`
  ).run(input.scope, input.contentKey, input.locale, input.value, nowIso(), nowIso());
};

export const getLocalizedMap = (locale: LocaleCode) => {
  const fallbackRows = db.prepare('SELECT content_key as contentKey, value FROM localized_content WHERE locale = ?').all(DEFAULT_LOCALE) as Array<{ contentKey: string; value: string }>;
  const localeRows = locale === DEFAULT_LOCALE
    ? []
    : (db.prepare('SELECT content_key as contentKey, value FROM localized_content WHERE locale = ?').all(locale) as Array<{ contentKey: string; value: string }>);

  const map = new Map<string, string>();
  for (const row of fallbackRows) map.set(row.contentKey, row.value);
  for (const row of localeRows) map.set(row.contentKey, row.value);
  return Object.fromEntries(map.entries());
};

export const listMenuItems = (): MenuItemDTO[] => {
  const items = db.prepare(
    `SELECT menu_items.*, media_assets.storage_path as mediaStoragePath
     FROM menu_items
     LEFT JOIN media_assets ON media_assets.id = menu_items.media_asset_id
     WHERE menu_items.active = 1
     ORDER BY menu_items.category, menu_items.sort_order`
  ).all() as Array<{
    id: number;
    category: MenuCategory;
    signature: number;
    price_label: string;
    sort_order: number;
    secondary_price_label: string | null;
    availability: number;
    featured: number;
    labels_json: string;
    allergens_json: string;
    mediaStoragePath: string | null;
    book_section: string | null;
    spread_style: string | null;
  }>;

  return items
    .map((item) => {
      const localizations = db.prepare(
        `SELECT locale, name, description
         FROM menu_item_localizations
         WHERE menu_item_id = ?`
      ).all(item.id) as Array<{ locale: LocaleCode; name: string; description: string }>;

      return {
        id: item.id,
        category: item.category,
        signature: Boolean(item.signature),
        priceLabel: item.price_label,
        sortOrder: item.sort_order,
        secondaryPriceLabel: item.secondary_price_label,
        availability: Boolean(item.availability),
        featured: Boolean(item.featured),
        labels: parseArray(item.labels_json) as MenuItemDTO['labels'],
        allergens: parseArray(item.allergens_json),
        mediaUrl: item.mediaStoragePath ? resolveMediaPublicUrl(item.mediaStoragePath) : null,
        bookSection: item.book_section,
        spreadStyle: item.spread_style,
        localizations: {
          hr: localizations.find((entry) => entry.locale === 'hr') ?? { name: '', description: '' },
          en: localizations.find((entry) => entry.locale === 'en') ?? { name: '', description: '' },
        },
      };
    })
    .sort((left, right) => {
      const leftCategory = menuCategoryOrderIndex.get(left.category) ?? Number.MAX_SAFE_INTEGER;
      const rightCategory = menuCategoryOrderIndex.get(right.category) ?? Number.MAX_SAFE_INTEGER;

      if (leftCategory !== rightCategory) return leftCategory - rightCategory;
      if (left.sortOrder !== right.sortOrder) return left.sortOrder - right.sortOrder;

      return left.localizations.hr.name.localeCompare(right.localizations.hr.name, 'hr');
    });
};

export const listMenuItemsPaginated = (query: AdminListQuery) => {
  const normalizedSearch = query.search.toLowerCase();
  const items = listMenuItems().filter((item) =>
    !normalizedSearch ||
    item.category.toLowerCase().includes(normalizedSearch) ||
    item.localizations.hr.name.toLowerCase().includes(normalizedSearch) ||
    item.localizations.en.name.toLowerCase().includes(normalizedSearch)
  );
  return paginateItems(items, query.page, query.pageSize);
};

export const upsertMenuItem = (input: MenuItemUpsertInput) =>
  runInTransaction(() => {
    const itemId =
      input.id ??
      Number(
        db
          .prepare(
            `INSERT INTO menu_items
             (category, signature, price_label, sort_order, active, secondary_price_label, availability, featured, labels_json, allergens_json, media_asset_id, book_section, spread_style, created_at, updated_at)
             VALUES (?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
          )
          .run(
            input.category,
            input.signature ? 1 : 0,
            input.priceLabel,
            input.sortOrder,
            input.secondaryPriceLabel,
            input.availability ? 1 : 0,
            input.featured ? 1 : 0,
            JSON.stringify(input.labels),
            JSON.stringify(input.allergens),
            input.mediaAssetId,
            input.bookSection,
            input.spreadStyle,
            nowIso(),
            nowIso()
          ).lastInsertRowid
      );

    if (input.id) {
      db.prepare(
        `UPDATE menu_items
         SET category = ?, signature = ?, price_label = ?, sort_order = ?, secondary_price_label = ?, availability = ?, featured = ?, labels_json = ?, allergens_json = ?, media_asset_id = ?, book_section = ?, spread_style = ?, updated_at = ?
         WHERE id = ?`
      ).run(
        input.category,
        input.signature ? 1 : 0,
        input.priceLabel,
        input.sortOrder,
        input.secondaryPriceLabel,
        input.availability ? 1 : 0,
        input.featured ? 1 : 0,
        JSON.stringify(input.labels),
        JSON.stringify(input.allergens),
        input.mediaAssetId,
        input.bookSection,
        input.spreadStyle,
        nowIso(),
        input.id
      );
    }

    for (const locale of ['hr', 'en'] as const) {
      db.prepare(
        `INSERT INTO menu_item_localizations (menu_item_id, locale, name, description, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT(menu_item_id, locale) DO UPDATE SET name = excluded.name, description = excluded.description, updated_at = excluded.updated_at`
      ).run(itemId, locale, input.localizations[locale].name, input.localizations[locale].description, nowIso(), nowIso());
    }

    return itemId;
  });

export const listHomepageModules = (): HomepageModuleDTO[] =>
  (
    db.prepare(
      `SELECT id, module_key as moduleKey, enabled, sort_order as sortOrder, settings_json as settings
       FROM homepage_modules
       ORDER BY sort_order ASC, module_key ASC`
    ).all() as Array<{ id: number; moduleKey: string; enabled: number; sortOrder: number; settings: string }>
  ).map((module) => ({
    id: module.id,
    moduleKey: module.moduleKey,
    enabled: Boolean(module.enabled),
    sortOrder: module.sortOrder,
    settings: module.settings ? JSON.parse(module.settings) : {},
  }));

export const upsertHomepageModule = (input: HomepageModuleUpsertInput) =>
  runInTransaction(() => {
    const existing = db.prepare('SELECT id FROM homepage_modules WHERE module_key = ?').get(input.moduleKey) as { id: number } | undefined;
    const id = input.id ?? existing?.id;

    if (!id) {
      return Number(
        db
          .prepare(
            `INSERT INTO homepage_modules (module_key, enabled, sort_order, settings_json, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?)`
          )
          .run(input.moduleKey, input.enabled ? 1 : 0, input.sortOrder, JSON.stringify(input.settings), nowIso(), nowIso()).lastInsertRowid
      );
    }

    db.prepare(
      `UPDATE homepage_modules
       SET module_key = ?, enabled = ?, sort_order = ?, settings_json = ?, updated_at = ?
       WHERE id = ?`
    ).run(input.moduleKey, input.enabled ? 1 : 0, input.sortOrder, JSON.stringify(input.settings), nowIso(), id);

    return id;
  });

export const updateBusinessSettings = (input: SiteSettingsDTO) => {
  db.prepare(
    `UPDATE business_settings
     SET business_name = ?, timezone = ?, phone = ?, whatsapp_phone = ?, email = ?, address = ?, city = ?, updated_at = ?
     WHERE id = 1`
  ).run(input.businessName, input.timezone, input.phone, input.whatsappPhone, input.email, input.address, input.city, nowIso());
};

export const getBootstrapPayload = (locale: LocaleCode, featuredEvents: BootstrapPayload['featuredEvents']): BootstrapPayload => {
  return {
    locale,
    fallbackLocale: DEFAULT_LOCALE,
    generatedAt: nowIso(),
    settings: getSettings(),
    menu: listMenuItems(),
    featuredEvents,
    announcements: listActiveAnnouncements(),
    glimpses: listGlimpseGroups(true),
    mediaCollections: listGalleryCollections({ readyOnly: true }),
  };
};
