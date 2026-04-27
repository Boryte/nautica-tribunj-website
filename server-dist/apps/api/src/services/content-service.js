"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBootstrapPayload = exports.updateBusinessSettings = exports.upsertHomepageModule = exports.listHomepageModules = exports.upsertMenuItem = exports.listMenuItemsPaginated = exports.listMenuItems = exports.getLocalizedMap = exports.upsertContentEntry = exports.listContentEntriesPaginated = exports.listContentEntries = exports.getBusinessSettings = void 0;
const src_1 = require("../../../../packages/shared/src");
const db_1 = require("../db");
const time_1 = require("../utils/time");
const announcement_service_1 = require("./announcement-service");
const glimpse_service_1 = require("./glimpse-service");
const media_service_1 = require("./media-service");
const admin_query_1 = require("../utils/admin-query");
const menuCategoryOrder = src_1.menuCategories;
const menuCategoryOrderIndex = new Map(menuCategoryOrder.map((category, index) => [category, index]));
const getSettings = () => {
    const row = db_1.db.prepare(`SELECT business_name as businessName, timezone, phone, whatsapp_phone as whatsappPhone, email, address, city
     FROM business_settings WHERE id = 1`).get();
    return (row ?? {
        businessName: 'Nautica',
        timezone: 'Europe/Zagreb',
        phone: '',
        whatsappPhone: '',
        email: '',
        address: '',
        city: '',
    });
};
const getBusinessSettings = () => getSettings();
exports.getBusinessSettings = getBusinessSettings;
const parseArray = (value) => {
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
const listContentEntries = () => db_1.db.prepare(`SELECT id, scope, content_key as contentKey, locale, value, updated_at as updatedAt
     FROM localized_content
     ORDER BY scope, content_key, locale`).all();
exports.listContentEntries = listContentEntries;
const listContentEntriesPaginated = (query) => {
    const normalizedSearch = query.search.toLowerCase();
    const items = (0, exports.listContentEntries)().filter((entry) => !normalizedSearch ||
        entry.scope.toLowerCase().includes(normalizedSearch) ||
        entry.contentKey.toLowerCase().includes(normalizedSearch) ||
        entry.value.toLowerCase().includes(normalizedSearch));
    return (0, admin_query_1.paginateItems)(items, query.page, query.pageSize);
};
exports.listContentEntriesPaginated = listContentEntriesPaginated;
const upsertContentEntry = (input) => {
    db_1.db.prepare(`INSERT INTO localized_content (scope, content_key, locale, value, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(scope, content_key, locale) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`).run(input.scope, input.contentKey, input.locale, input.value, (0, time_1.nowIso)(), (0, time_1.nowIso)());
};
exports.upsertContentEntry = upsertContentEntry;
const getLocalizedMap = (locale) => {
    const fallbackRows = db_1.db.prepare('SELECT content_key as contentKey, value FROM localized_content WHERE locale = ?').all(src_1.DEFAULT_LOCALE);
    const localeRows = locale === src_1.DEFAULT_LOCALE
        ? []
        : db_1.db.prepare('SELECT content_key as contentKey, value FROM localized_content WHERE locale = ?').all(locale);
    const map = new Map();
    for (const row of fallbackRows)
        map.set(row.contentKey, row.value);
    for (const row of localeRows)
        map.set(row.contentKey, row.value);
    return Object.fromEntries(map.entries());
};
exports.getLocalizedMap = getLocalizedMap;
const listMenuItems = () => {
    const items = db_1.db.prepare(`SELECT menu_items.*, media_assets.storage_path as mediaStoragePath
     FROM menu_items
     LEFT JOIN media_assets ON media_assets.id = menu_items.media_asset_id
     WHERE menu_items.active = 1
     ORDER BY menu_items.category, menu_items.sort_order`).all();
    return items
        .map((item) => {
        const localizations = db_1.db.prepare(`SELECT locale, name, description
         FROM menu_item_localizations
         WHERE menu_item_id = ?`).all(item.id);
        return {
            id: item.id,
            category: item.category,
            signature: Boolean(item.signature),
            priceLabel: item.price_label,
            sortOrder: item.sort_order,
            secondaryPriceLabel: item.secondary_price_label,
            availability: Boolean(item.availability),
            featured: Boolean(item.featured),
            labels: parseArray(item.labels_json),
            allergens: parseArray(item.allergens_json),
            mediaUrl: item.mediaStoragePath ? (0, media_service_1.resolveMediaPublicUrl)(item.mediaStoragePath) : null,
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
        if (leftCategory !== rightCategory)
            return leftCategory - rightCategory;
        if (left.sortOrder !== right.sortOrder)
            return left.sortOrder - right.sortOrder;
        return left.localizations.hr.name.localeCompare(right.localizations.hr.name, 'hr');
    });
};
exports.listMenuItems = listMenuItems;
const listMenuItemsPaginated = (query) => {
    const normalizedSearch = query.search.toLowerCase();
    const items = (0, exports.listMenuItems)().filter((item) => !normalizedSearch ||
        item.category.toLowerCase().includes(normalizedSearch) ||
        item.localizations.hr.name.toLowerCase().includes(normalizedSearch) ||
        item.localizations.en.name.toLowerCase().includes(normalizedSearch));
    return (0, admin_query_1.paginateItems)(items, query.page, query.pageSize);
};
exports.listMenuItemsPaginated = listMenuItemsPaginated;
const upsertMenuItem = (input) => (0, db_1.runInTransaction)(() => {
    const itemId = input.id ??
        Number(db_1.db
            .prepare(`INSERT INTO menu_items
             (category, signature, price_label, sort_order, active, secondary_price_label, availability, featured, labels_json, allergens_json, media_asset_id, book_section, spread_style, created_at, updated_at)
             VALUES (?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
            .run(input.category, input.signature ? 1 : 0, input.priceLabel, input.sortOrder, input.secondaryPriceLabel, input.availability ? 1 : 0, input.featured ? 1 : 0, JSON.stringify(input.labels), JSON.stringify(input.allergens), input.mediaAssetId, input.bookSection, input.spreadStyle, (0, time_1.nowIso)(), (0, time_1.nowIso)()).lastInsertRowid);
    if (input.id) {
        db_1.db.prepare(`UPDATE menu_items
         SET category = ?, signature = ?, price_label = ?, sort_order = ?, secondary_price_label = ?, availability = ?, featured = ?, labels_json = ?, allergens_json = ?, media_asset_id = ?, book_section = ?, spread_style = ?, updated_at = ?
         WHERE id = ?`).run(input.category, input.signature ? 1 : 0, input.priceLabel, input.sortOrder, input.secondaryPriceLabel, input.availability ? 1 : 0, input.featured ? 1 : 0, JSON.stringify(input.labels), JSON.stringify(input.allergens), input.mediaAssetId, input.bookSection, input.spreadStyle, (0, time_1.nowIso)(), input.id);
    }
    for (const locale of ['hr', 'en']) {
        db_1.db.prepare(`INSERT INTO menu_item_localizations (menu_item_id, locale, name, description, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT(menu_item_id, locale) DO UPDATE SET name = excluded.name, description = excluded.description, updated_at = excluded.updated_at`).run(itemId, locale, input.localizations[locale].name, input.localizations[locale].description, (0, time_1.nowIso)(), (0, time_1.nowIso)());
    }
    return itemId;
});
exports.upsertMenuItem = upsertMenuItem;
const listHomepageModules = () => db_1.db.prepare(`SELECT id, module_key as moduleKey, enabled, sort_order as sortOrder, settings_json as settings
       FROM homepage_modules
       ORDER BY sort_order ASC, module_key ASC`).all().map((module) => ({
    id: module.id,
    moduleKey: module.moduleKey,
    enabled: Boolean(module.enabled),
    sortOrder: module.sortOrder,
    settings: module.settings ? JSON.parse(module.settings) : {},
}));
exports.listHomepageModules = listHomepageModules;
const upsertHomepageModule = (input) => (0, db_1.runInTransaction)(() => {
    const existing = db_1.db.prepare('SELECT id FROM homepage_modules WHERE module_key = ?').get(input.moduleKey);
    const id = input.id ?? existing?.id;
    if (!id) {
        return Number(db_1.db
            .prepare(`INSERT INTO homepage_modules (module_key, enabled, sort_order, settings_json, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?)`)
            .run(input.moduleKey, input.enabled ? 1 : 0, input.sortOrder, JSON.stringify(input.settings), (0, time_1.nowIso)(), (0, time_1.nowIso)()).lastInsertRowid);
    }
    db_1.db.prepare(`UPDATE homepage_modules
       SET module_key = ?, enabled = ?, sort_order = ?, settings_json = ?, updated_at = ?
       WHERE id = ?`).run(input.moduleKey, input.enabled ? 1 : 0, input.sortOrder, JSON.stringify(input.settings), (0, time_1.nowIso)(), id);
    return id;
});
exports.upsertHomepageModule = upsertHomepageModule;
const updateBusinessSettings = (input) => {
    db_1.db.prepare(`UPDATE business_settings
     SET business_name = ?, timezone = ?, phone = ?, whatsapp_phone = ?, email = ?, address = ?, city = ?, updated_at = ?
     WHERE id = 1`).run(input.businessName, input.timezone, input.phone, input.whatsappPhone, input.email, input.address, input.city, (0, time_1.nowIso)());
};
exports.updateBusinessSettings = updateBusinessSettings;
const getBootstrapPayload = (locale, featuredEvents) => {
    return {
        locale,
        fallbackLocale: src_1.DEFAULT_LOCALE,
        generatedAt: (0, time_1.nowIso)(),
        settings: getSettings(),
        menu: (0, exports.listMenuItems)(),
        featuredEvents,
        announcements: (0, announcement_service_1.listActiveAnnouncements)(),
        glimpses: (0, glimpse_service_1.listGlimpseGroups)(true),
        mediaCollections: (0, media_service_1.listGalleryCollections)({ readyOnly: true }),
    };
};
exports.getBootstrapPayload = getBootstrapPayload;
