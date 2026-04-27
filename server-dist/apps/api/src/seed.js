"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedDatabase = void 0;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const db_1 = require("./db");
const config_1 = require("./config");
const media_service_1 = require("./services/media-service");
const time_1 = require("./utils/time");
const menu_seeds_1 = require("./data/menu-seeds");
const logger_1 = require("./logger");
const siteMediaDirectory = node_path_1.default.resolve(process.cwd(), 'public', 'site-media');
const localizedContentRows = [
    ['home', 'hero.kicker', 'hr', 'Sunset coffee & cocktail ritual'],
    ['home', 'hero.kicker', 'en', 'Sunset coffee & cocktail ritual'],
    ['home', 'hero.eyebrow', 'hr', 'Tribunj waterfront house of golden hour'],
    ['home', 'hero.eyebrow', 'en', 'Tribunj waterfront house of golden hour'],
    ['home', 'hero.headlinePrimary', 'hr', 'Nautica'],
    ['home', 'hero.headlinePrimary', 'en', 'Nautica'],
    ['home', 'hero.headlineSecondary', 'hr', 'Mjesto gdje se more, glazba i ritual usluge susreću u jednoj večeri.'],
    ['home', 'hero.headlineSecondary', 'en', 'Where the sea, music, and ritual service meet in a single evening.'],
    ['home', 'hero.description', 'hr', 'Od jutarnjeg espressa do večernjeg aperitiva, Nautica oblikuje dan kao mediteranski editorial doživljaj.'],
    ['home', 'hero.description', 'en', 'From morning espresso to evening aperitivo, Nautica shapes the day as a Mediterranean editorial experience.'],
    ['home', 'signature.title', 'hr', 'Potpisni trenuci'],
    ['home', 'signature.title', 'en', 'Signature moments'],
    ['home', 'signature.body', 'hr', 'Kava uz more, zalazak s ritualnim koktelom i večeri koje se planiraju unaprijed.'],
    ['home', 'signature.body', 'en', 'Coffee by the sea, sunset ritual cocktails, and evenings worth planning ahead for.'],
    ['home', 'reservation.title', 'hr', 'Rezervirajte svoj stol uz more'],
    ['home', 'reservation.title', 'en', 'Reserve your waterfront table'],
    ['home', 'visit.title', 'hr', 'Posjetite Nauticu'],
    ['home', 'visit.title', 'en', 'Visit Nautica'],
    ['about', 'hero.title', 'hr', 'Naša priča'],
    ['about', 'hero.title', 'en', 'Our story'],
    ['about', 'body.story', 'hr', 'Nautica je nastala iz ljubavi prema obali, dobrom ritmu usluge i večerima koje vrijedi pamtiti.'],
    ['about', 'body.story', 'en', 'Nautica was shaped by a love of the coast, graceful service, and evenings worth remembering.'],
    ['contact', 'location.label', 'hr', 'Lokacija'],
    ['contact', 'location.label', 'en', 'Location'],
    ['seo', 'home.title', 'hr', 'Nautica | Premium seaside bar i lounge'],
    ['seo', 'home.title', 'en', 'Nautica | Premium seaside bar and lounge'],
    ['seo', 'home.description', 'hr', 'Cinematic waterfront hospitality in Tribunj: sunset cocktails, events, gallery moments, and premium reservations.'],
    ['seo', 'home.description', 'en', 'Cinematic waterfront hospitality in Tribunj: sunset cocktails, events, gallery moments, and premium reservations.'],
];
const eventSeeds = [
    {
        slug: 'sunset-sessions-vol-iii',
        status: 'published',
        featured: 1,
        capacity: 60,
        waitlistEnabled: 1,
        startsAt: '2026-07-12T17:00:00.000Z',
        endsAt: '2026-07-12T22:00:00.000Z',
        imageUrl: '/site-media/events-featured.jpg',
        category: 'music',
        reservationMode: 'required',
        priceLabel: 'Free entry',
        ticketUrl: null,
        tags: ['dj', 'sunset', 'cocktails'],
        hrTitle: 'Sunset Sessions Vol. III',
        hrTeaser: 'DJ setovi, zalazak sunca i signature kokteli na terasi.',
        hrDescription: 'Treće izdanje Sunset Sessions večeri donosi DJ selekciju, lounge atmosferu i rezervacijske pakete uz more.',
        enTitle: 'Sunset Sessions Vol. III',
        enTeaser: 'DJ sets, golden hour, and signature cocktails on the terrace.',
        enDescription: 'The third edition of Sunset Sessions brings curated DJ sets, lounge atmosphere, and reservation packages by the sea.',
    },
    {
        slug: 'jazz-by-the-sea',
        status: 'published',
        featured: 0,
        capacity: 40,
        waitlistEnabled: 1,
        startsAt: '2026-07-19T18:00:00.000Z',
        endsAt: '2026-07-19T22:30:00.000Z',
        imageUrl: '/site-media/evening-atmosphere.jpg',
        category: 'music',
        reservationMode: 'optional',
        priceLabel: '€18',
        ticketUrl: 'https://tickets.nautica.hr/jazz-by-the-sea',
        tags: ['live', 'jazz'],
        hrTitle: 'Jazz by the Sea',
        hrTeaser: 'Večer jazza uživo u intimnijem ritmu terase.',
        hrDescription: 'Posebna večer uz jazz trio, premium servis i ograničen broj mjesta na terasi.',
        enTitle: 'Jazz by the Sea',
        enTeaser: 'An evening of live jazz with a more intimate terrace rhythm.',
        enDescription: 'A special evening with a live jazz trio, premium service, and limited terrace seating.',
    },
];
const homepageModules = [
    ['announcement-bar', 1, 1, { rotationMs: 6500 }],
    ['glimpse-rail', 1, 2, { titleKey: 'home.signature.title' }],
    ['signature-moments', 1, 3, { backgroundStyle: 'split-image' }],
    ['featured-events', 1, 4, { maxItems: 3 }],
    ['menu-preview', 1, 5, { mode: 'book-teaser' }],
    ['gallery-block', 1, 6, { collection: 'zalazak' }],
    ['reservation-cta', 1, 7, { intentDefault: 'standard' }],
    ['visit-block', 1, 8, { showMap: true }],
];
const announcementSeeds = [
    {
        status: 'active',
        variant: 'event',
        priority: 200,
        sortOrder: 1,
        dismissible: 1,
        persistentDismissalKey: 'summer-sessions',
        ctaUrl: '/events/sunset-sessions-vol-iii',
        eventSlug: 'sunset-sessions-vol-iii',
        reservationIntent: 'event',
        startsAt: '2026-05-01T08:00:00.000Z',
        endsAt: '2026-08-31T23:00:00.000Z',
        hr: {
            title: 'Ljetni ritam Nautice',
            body: 'Sunset Sessions vraća se na terasu. Rezervacije za najbolja mjesta su otvorene.',
            ctaLabel: 'Pogledajte događaj',
        },
        en: {
            title: 'Nautica summer rhythm',
            body: 'Sunset Sessions returns to the terrace. Reservations for the best tables are now open.',
            ctaLabel: 'View event',
        },
    },
    {
        status: 'active',
        variant: 'promo',
        priority: 120,
        sortOrder: 2,
        dismissible: 0,
        persistentDismissalKey: null,
        ctaUrl: '/reservation',
        eventSlug: null,
        reservationIntent: 'vip',
        startsAt: '2026-04-01T08:00:00.000Z',
        endsAt: null,
        hr: {
            title: 'VIP kutak uz zalazak',
            body: 'Rezervirajte intimniji lounge kutak za posebne večeri i privatne trenutke.',
            ctaLabel: 'Rezervirajte',
        },
        en: {
            title: 'VIP sunset corner',
            body: 'Reserve a more intimate lounge corner for special evenings and private moments.',
            ctaLabel: 'Reserve',
        },
    },
];
const mediaSeedFiles = [
    ['hero-sunset.jpg', 'zalazak', 'Nautica zalazak', 'Nautica sunset terrace'],
    ['coffee-morning.jpg', 'kava', 'Jutarnja kava', 'Morning coffee'],
    ['sunset-cocktails.jpg', 'kokteli', 'Kokteli na zalasku', 'Sunset cocktails'],
    ['evening-atmosphere.jpg', 'dogadanja', 'Večernja atmosfera', 'Evening atmosphere'],
    ['events-featured.jpg', 'dogadanja', 'Događanje uz more', 'Seaside event'],
    ['about-story.jpg', 'interijer', 'Detalji prostora', 'Interior details'],
    ['gallery-aerial.jpg', 'terasa', 'Pogled iz zraka', 'Aerial terrace view'],
    ['nautica-closeup.jpg', 'interijer', 'Detalj Nautice', 'Nautica close-up'],
];
const faqSeeds = [
    {
        active: 1,
        category: 'Reservations',
        sortOrder: 1,
        hrQuestion: 'Kako funkcionira rezervacija?',
        hrAnswer: 'Rezervacija se otvara izravno u WhatsApp Business razgovoru s unaprijed ispunjenim detaljima. Sustav paralelno sprema zahtjev u backend evidenciju čim je API dostupan.',
        enQuestion: 'How do reservations work?',
        enAnswer: 'Reservations open directly in a WhatsApp Business conversation with the booking details already filled in. The same request is also synced into the backend history as soon as the API is available.',
    },
    {
        active: 1,
        category: 'Reservations',
        sortOrder: 2,
        hrQuestion: 'Koliko unaprijed trebamo rezervirati VIP zonu?',
        hrAnswer: 'Za VIP i veće grupe preporuka je javiti se što ranije, posebno za vikende, zalaske i event večeri. Tim potvrđuje raspoloživost kroz isti WhatsApp tok.',
        enQuestion: 'How far in advance should we reserve the VIP area?',
        enAnswer: 'For VIP seating and larger groups, earlier notice is recommended, especially for weekends, sunset slots, and event nights. The team confirms availability through the same WhatsApp flow.',
    },
    {
        active: 1,
        category: 'Events',
        sortOrder: 1,
        hrQuestion: 'Jesu li događanja uvijek uz rezervaciju?',
        hrAnswer: 'Ne uvijek. Neka događanja koriste vanjski ticketing, neka traže rezervaciju, a neka dopuštaju samo interes ili dolazak bez rezervacije, ovisno o formatu večeri.',
        enQuestion: 'Do events always require a reservation?',
        enAnswer: 'Not always. Some events use external ticketing, some require a reservation, and some allow interest-only or walk-in attendance depending on the format of the night.',
    },
    {
        active: 1,
        category: 'Venue',
        sortOrder: 1,
        hrQuestion: 'Možete li organizirati privatni događaj ili proslavu?',
        hrAnswer: 'Da. Za privatne večeri, proslave i veće grupe pošaljite upit s osnovnim informacijama, brojem gostiju i željenim datumom. Tim se javlja s raspoloživim opcijama.',
        enQuestion: 'Can Nautica host a private event or celebration?',
        enAnswer: 'Yes. For private evenings, celebrations, and larger groups, send an inquiry with the basic details, guest count, and preferred date, and the team will come back with the available options.',
    },
];
const ensureSeedMedia = () => {
    (0, media_service_1.ensureMediaDirectory)();
    const mirroredDirectories = new Set([node_path_1.default.resolve(config_1.env.MEDIA_UPLOAD_DIR), node_path_1.default.resolve(process.cwd(), 'public', 'uploads')]);
    const sourceEntries = node_fs_1.default.existsSync(siteMediaDirectory) ? node_fs_1.default.readdirSync(siteMediaDirectory, { withFileTypes: true }) : [];
    for (const entry of sourceEntries) {
        if (!entry.isFile())
            continue;
        const source = node_path_1.default.join(siteMediaDirectory, entry.name);
        for (const directory of mirroredDirectories) {
            node_fs_1.default.mkdirSync(directory, { recursive: true });
            const destination = node_path_1.default.join(directory, entry.name);
            if (!node_fs_1.default.existsSync(destination))
                node_fs_1.default.copyFileSync(source, destination);
        }
    }
};
const inferMimeTypeFromFilename = (filename) => {
    const extension = node_path_1.default.extname(filename).toLowerCase();
    switch (extension) {
        case '.png':
            return 'image/png';
        case '.webp':
            return 'image/webp';
        case '.avif':
            return 'image/avif';
        default:
            return 'image/jpeg';
    }
};
const createMediaAsset = (filename, collectionSlug, hrAlt, enAlt) => {
    const sourcePath = node_path_1.default.join(siteMediaDirectory, filename);
    const fileStats = node_fs_1.default.existsSync(sourcePath) ? node_fs_1.default.statSync(sourcePath) : null;
    const mimeType = inferMimeTypeFromFilename(filename);
    const existing = db_1.db.prepare('SELECT id FROM media_assets WHERE filename = ?').get(filename);
    const assetId = existing?.id ??
        Number(db_1.db
            .prepare(`INSERT INTO media_assets
           (filename, original_filename, storage_path, mime_type, size_bytes, width, height, status, featured, tags_json, focal_point_x, focal_point_y, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, NULL, NULL, 'ready', 0, ?, 0.5, 0.45, ?, ?)`)
            .run(filename, filename, sourcePath, mimeType, fileStats?.size ?? 0, JSON.stringify([collectionSlug, 'premium']), (0, time_1.nowIso)(), (0, time_1.nowIso)()).lastInsertRowid);
    db_1.db.prepare(`UPDATE media_assets
     SET original_filename = ?, storage_path = ?, mime_type = ?, size_bytes = ?, status = 'ready', tags_json = ?, updated_at = ?
     WHERE id = ?`).run(filename, sourcePath, mimeType, fileStats?.size ?? 0, JSON.stringify([collectionSlug, 'premium']), (0, time_1.nowIso)(), assetId);
    for (const [locale, alt] of [
        ['hr', hrAlt],
        ['en', enAlt],
    ]) {
        db_1.db.prepare(`INSERT INTO media_asset_localizations (media_asset_id, locale, alt_text, caption, created_at, updated_at)
       VALUES (?, ?, ?, '', ?, ?)
       ON CONFLICT(media_asset_id, locale) DO UPDATE SET alt_text = excluded.alt_text, updated_at = excluded.updated_at`).run(assetId, locale, alt, (0, time_1.nowIso)(), (0, time_1.nowIso)());
    }
    const collection = db_1.db.prepare('SELECT id FROM media_collections WHERE slug = ?').get(collectionSlug);
    if (collection) {
        db_1.db.prepare(`INSERT INTO media_collection_items (collection_id, media_asset_id, sort_order, created_at)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(collection_id, media_asset_id) DO NOTHING`).run(collection.id, assetId, 0, (0, time_1.nowIso)());
    }
    return assetId;
};
const seedDatabase = () => {
    if (!config_1.env.ENABLE_SEED_CONTENT)
        return;
    ensureSeedMedia();
    (0, db_1.runInTransaction)(() => {
        const adminExists = db_1.db.prepare('SELECT id FROM admins LIMIT 1').get();
        if (!adminExists) {
            if (!config_1.env.ADMIN_BOOTSTRAP_EMAIL || !config_1.env.ADMIN_BOOTSTRAP_PASSWORD) {
                logger_1.logger.warn('admin_bootstrap_skipped_missing_credentials');
            }
            else {
                db_1.db.prepare(`INSERT INTO admins (email, password_hash, display_name, role, created_at, updated_at)
           VALUES (?, ?, ?, 'staff', ?, ?)`).run(config_1.env.ADMIN_BOOTSTRAP_EMAIL, bcryptjs_1.default.hashSync(config_1.env.ADMIN_BOOTSTRAP_PASSWORD, 12), 'Nautica Admin', (0, time_1.nowIso)(), (0, time_1.nowIso)());
            }
        }
        db_1.db.prepare(`INSERT INTO business_settings (id, business_name, timezone, phone, whatsapp_phone, email, address, city, created_at, updated_at)
       VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         business_name = excluded.business_name,
         timezone = excluded.timezone,
         phone = excluded.phone,
         whatsapp_phone = excluded.whatsapp_phone,
         email = excluded.email,
         address = excluded.address,
         city = excluded.city,
         updated_at = excluded.updated_at`).run('Nautica', config_1.env.BUSINESS_TIMEZONE, '+385 99 785 6785', '+385 99 785 6785', 'trebocconi@trebocconi.com', 'DONJA RIVA 55', '22212 Tribunj, Croatia', (0, time_1.nowIso)(), (0, time_1.nowIso)());
        for (const [weekday, opensAt, closesAt, isClosed] of [
            [0, '09:00', '01:00', 0],
            [1, '08:00', '00:00', 0],
            [2, '08:00', '00:00', 0],
            [3, '08:00', '00:00', 0],
            [4, '08:00', '00:00', 0],
            [5, '08:00', '01:00', 0],
            [6, '09:00', '01:00', 0],
        ]) {
            db_1.db.prepare(`INSERT INTO business_hours (weekday, opens_at, closes_at, is_closed, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT(weekday) DO UPDATE SET
           opens_at = excluded.opens_at,
           closes_at = excluded.closes_at,
           is_closed = excluded.is_closed,
           updated_at = excluded.updated_at`).run(weekday, opensAt, closesAt, isClosed, (0, time_1.nowIso)(), (0, time_1.nowIso)());
        }
        for (const [scope, contentKey, locale, value] of localizedContentRows) {
            db_1.db.prepare(`INSERT INTO localized_content (scope, content_key, locale, value, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT(scope, content_key, locale) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`).run(scope, contentKey, locale, value, (0, time_1.nowIso)(), (0, time_1.nowIso)());
        }
        for (const seed of faqSeeds) {
            const existing = db_1.db.prepare('SELECT id FROM faqs WHERE category = ? AND sort_order = ?').get(seed.category, seed.sortOrder);
            const faqId = existing?.id ??
                Number(db_1.db
                    .prepare(`INSERT INTO faqs (active, category, sort_order, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?)`)
                    .run(seed.active, seed.category, seed.sortOrder, (0, time_1.nowIso)(), (0, time_1.nowIso)()).lastInsertRowid);
            db_1.db.prepare(`UPDATE faqs
         SET active = ?, category = ?, sort_order = ?, updated_at = ?
         WHERE id = ?`).run(seed.active, seed.category, seed.sortOrder, (0, time_1.nowIso)(), faqId);
            for (const [locale, question, answer] of [
                ['hr', seed.hrQuestion, seed.hrAnswer],
                ['en', seed.enQuestion, seed.enAnswer],
            ]) {
                db_1.db.prepare(`INSERT INTO faq_localizations (faq_id, locale, question, answer, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?)
           ON CONFLICT(faq_id, locale) DO UPDATE SET question = excluded.question, answer = excluded.answer, updated_at = excluded.updated_at`).run(faqId, locale, question, answer, (0, time_1.nowIso)(), (0, time_1.nowIso)());
            }
        }
        for (const [slug, name, sortOrder] of [
            ['interijer', 'Interijer', 1],
            ['terasa', 'Terasa', 2],
            ['kava', 'Kava', 3],
            ['kokteli', 'Kokteli', 4],
            ['zalazak', 'Zalazak', 5],
            ['dogadanja', 'Događanja', 6],
            ['hrana', 'Hrana', 7],
        ]) {
            db_1.db.prepare(`INSERT INTO media_collections (slug, name, sort_order, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(slug) DO UPDATE SET name = excluded.name, sort_order = excluded.sort_order, updated_at = excluded.updated_at`).run(slug, name, sortOrder, (0, time_1.nowIso)(), (0, time_1.nowIso)());
        }
        const mediaIds = new Map();
        for (const [filename, collectionSlug, hrAlt, enAlt] of mediaSeedFiles) {
            mediaIds.set(filename, createMediaAsset(filename, collectionSlug, hrAlt, enAlt));
        }
        const resolveMenuItemMediaId = (category) => {
            switch (category) {
                case 'hot_beverages':
                    return mediaIds.get('coffee-morning.jpg');
                case 'signature_cocktails':
                case 'spritz':
                case 'vodka':
                case 'cognac':
                case 'whisky':
                case 'rum':
                case 'tequila_mezcal':
                case 'gin':
                case 'liqueurs':
                case 'wine':
                case 'beer':
                case 'cider':
                    return mediaIds.get('sunset-cocktails.jpg');
                default:
                    return mediaIds.get('about-story.jpg');
            }
        };
        db_1.db.prepare('DELETE FROM menu_item_localizations').run();
        db_1.db.prepare('DELETE FROM menu_items').run();
        for (const seed of menu_seeds_1.menuSeeds) {
            const existing = db_1.db.prepare('SELECT id FROM menu_items WHERE category = ? AND sort_order = ?').get(seed.category, seed.sortOrder);
            const menuItemId = existing?.id ??
                Number(db_1.db
                    .prepare(`INSERT INTO menu_items
               (category, signature, price_label, sort_order, active, secondary_price_label, availability, featured, labels_json, allergens_json, media_asset_id, book_section, spread_style, created_at, updated_at)
               VALUES (?, ?, ?, ?, 1, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?)`)
                    .run(seed.category, seed.signature, seed.priceLabel, seed.sortOrder, seed.secondaryPriceLabel, seed.featured, JSON.stringify(seed.labels), JSON.stringify(seed.allergens), resolveMenuItemMediaId(seed.category), seed.bookSection, seed.spreadStyle, (0, time_1.nowIso)(), (0, time_1.nowIso)()).lastInsertRowid);
            db_1.db.prepare(`UPDATE menu_items
         SET secondary_price_label = ?, availability = 1, featured = ?, labels_json = ?, allergens_json = ?, media_asset_id = ?, book_section = ?, spread_style = ?, updated_at = ?
         WHERE id = ?`).run(seed.secondaryPriceLabel, seed.featured, JSON.stringify(seed.labels), JSON.stringify(seed.allergens), resolveMenuItemMediaId(seed.category), seed.bookSection, seed.spreadStyle, (0, time_1.nowIso)(), menuItemId);
            for (const [locale, name, description] of [
                ['hr', seed.hrName, seed.hrDescription],
                ['en', seed.enName, seed.enDescription],
            ]) {
                db_1.db.prepare(`INSERT INTO menu_item_localizations (menu_item_id, locale, name, description, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?)
           ON CONFLICT(menu_item_id, locale) DO UPDATE SET name = excluded.name, description = excluded.description, updated_at = excluded.updated_at`).run(menuItemId, locale, name, description, (0, time_1.nowIso)(), (0, time_1.nowIso)());
            }
        }
        for (const seed of eventSeeds) {
            const existing = db_1.db.prepare('SELECT id FROM events WHERE slug = ?').get(seed.slug);
            const posterMediaId = seed.slug === 'sunset-sessions-vol-iii' ? mediaIds.get('events-featured.jpg') : mediaIds.get('evening-atmosphere.jpg');
            const eventId = existing?.id ??
                Number(db_1.db
                    .prepare(`INSERT INTO events
               (slug, status, featured, capacity, waitlist_enabled, starts_at, ends_at, image_url, category, timezone, poster_media_id, reservation_mode, price_label, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
                    .run(seed.slug, seed.status, seed.featured, seed.capacity, seed.waitlistEnabled, seed.startsAt, seed.endsAt, seed.imageUrl, seed.category, config_1.env.BUSINESS_TIMEZONE, posterMediaId, seed.reservationMode, seed.priceLabel, (0, time_1.nowIso)(), (0, time_1.nowIso)()).lastInsertRowid);
            db_1.db.prepare(`UPDATE events
         SET category = ?, timezone = ?, poster_media_id = ?, reservation_mode = ?, price_label = ?, ticket_url = ?, updated_at = ?
         WHERE id = ?`).run(seed.category, config_1.env.BUSINESS_TIMEZONE, posterMediaId, seed.reservationMode, seed.priceLabel, seed.ticketUrl, (0, time_1.nowIso)(), eventId);
            for (const [locale, title, teaser, description] of [
                ['hr', seed.hrTitle, seed.hrTeaser, seed.hrDescription],
                ['en', seed.enTitle, seed.enTeaser, seed.enDescription],
            ]) {
                db_1.db.prepare(`INSERT INTO event_localizations (event_id, locale, title, teaser, description, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(event_id, locale) DO UPDATE SET title = excluded.title, teaser = excluded.teaser, description = excluded.description, updated_at = excluded.updated_at`).run(eventId, locale, title, teaser, description, (0, time_1.nowIso)(), (0, time_1.nowIso)());
            }
            db_1.db.prepare('DELETE FROM event_tags WHERE event_id = ?').run(eventId);
            seed.tags.forEach((tag) => {
                db_1.db.prepare('INSERT OR IGNORE INTO event_tags (event_id, tag, created_at) VALUES (?, ?, ?)').run(eventId, tag, (0, time_1.nowIso)());
            });
            const galleryMedia = seed.slug === 'sunset-sessions-vol-iii'
                ? [mediaIds.get('events-featured.jpg'), mediaIds.get('sunset-cocktails.jpg'), mediaIds.get('gallery-aerial.jpg')]
                : [mediaIds.get('evening-atmosphere.jpg'), mediaIds.get('about-story.jpg')];
            db_1.db.prepare('DELETE FROM event_media WHERE event_id = ?').run(eventId);
            galleryMedia.forEach((mediaId, index) => {
                if (!mediaId)
                    return;
                db_1.db.prepare(`INSERT OR IGNORE INTO event_media (event_id, media_asset_id, sort_order, created_at)
           VALUES (?, ?, ?, ?)`).run(eventId, mediaId, index, (0, time_1.nowIso)());
            });
        }
        for (const [moduleKey, enabled, sortOrder, settings] of homepageModules) {
            db_1.db.prepare(`INSERT INTO homepage_modules (module_key, enabled, sort_order, settings_json, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT(module_key) DO UPDATE SET enabled = excluded.enabled, sort_order = excluded.sort_order, settings_json = excluded.settings_json, updated_at = excluded.updated_at`).run(moduleKey, enabled, sortOrder, JSON.stringify(settings), (0, time_1.nowIso)(), (0, time_1.nowIso)());
        }
        for (const seed of announcementSeeds) {
            const eventId = seed.eventSlug
                ? db_1.db.prepare('SELECT id FROM events WHERE slug = ?').get(seed.eventSlug)?.id ?? null
                : null;
            const existing = db_1.db.prepare('SELECT id FROM announcements WHERE persistent_dismissal_key IS ? AND priority = ?').get(seed.persistentDismissalKey, seed.priority);
            const announcementId = existing?.id ??
                Number(db_1.db
                    .prepare(`INSERT INTO announcements
               (status, variant, priority, sort_order, dismissible, persistent_dismissal_key, cta_url, event_id, reservation_intent, starts_at, ends_at, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
                    .run(seed.status, seed.variant, seed.priority, seed.sortOrder, seed.dismissible, seed.persistentDismissalKey, seed.ctaUrl, eventId, seed.reservationIntent, seed.startsAt, seed.endsAt, (0, time_1.nowIso)(), (0, time_1.nowIso)()).lastInsertRowid);
            for (const [locale, copy] of [
                ['hr', seed.hr],
                ['en', seed.en],
            ]) {
                db_1.db.prepare(`INSERT INTO announcement_localizations (announcement_id, locale, title, body, cta_label, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(announcement_id, locale) DO UPDATE SET title = excluded.title, body = excluded.body, cta_label = excluded.cta_label, updated_at = excluded.updated_at`).run(announcementId, locale, copy.title, copy.body, copy.ctaLabel, (0, time_1.nowIso)(), (0, time_1.nowIso)());
            }
        }
        const glimpseExists = db_1.db.prepare('SELECT id FROM glimpse_groups LIMIT 1').get();
        if (!glimpseExists) {
            const groupId = Number(db_1.db
                .prepare(`INSERT INTO glimpse_groups (active, sort_order, cover_media_id, created_at, updated_at)
             VALUES (1, 1, ?, ?, ?)`)
                .run(mediaIds.get('hero-sunset.jpg') ?? null, (0, time_1.nowIso)(), (0, time_1.nowIso)()).lastInsertRowid);
            for (const [locale, label, title] of [
                ['hr', 'Glimpse', 'Pogled u Nauticu'],
                ['en', 'Glimpse', 'A glimpse into Nautica'],
            ]) {
                db_1.db.prepare(`INSERT INTO glimpse_group_localizations (group_id, locale, label, title, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?)`).run(groupId, locale, label, title, (0, time_1.nowIso)(), (0, time_1.nowIso)());
            }
            const slides = [
                ['hero-sunset.jpg', 'Zlatni sat', 'Terasa koja mijenja ritam grada kako sunce tone.', 'Golden hour', 'A terrace that shifts the rhythm of the city as the sun drops.', '/reservation'],
                ['coffee-morning.jpg', 'Jutarnji ritual', 'Prvi espresso uz pogled koji budi obalu.', 'Morning ritual', 'The first espresso with a view that wakes the coast.', '/menu'],
                ['sunset-cocktails.jpg', 'Večernji potpis', 'Signature kokteli u najtoplijem svjetlu dana.', 'Evening signature', 'Signature cocktails in the warmest light of the day.', '/events'],
            ];
            slides.forEach(([filename, hrHeadline, hrBody, enHeadline, enBody, ctaUrl], index) => {
                const slideId = Number(db_1.db
                    .prepare(`INSERT INTO glimpse_slides (group_id, media_type, media_asset_id, duration_ms, overlay_intensity, text_alignment, sort_order, cta_url, created_at, updated_at)
               VALUES (?, 'image', ?, 4800, 0.46, 'left', ?, ?, ?, ?)`)
                    .run(groupId, mediaIds.get(filename) ?? null, index + 1, ctaUrl, (0, time_1.nowIso)(), (0, time_1.nowIso)()).lastInsertRowid);
                for (const [locale, headline, body, ctaLabel] of [
                    ['hr', hrHeadline, hrBody, 'Otkrijte'],
                    ['en', enHeadline, enBody, 'Discover'],
                ]) {
                    db_1.db.prepare(`INSERT INTO glimpse_slide_localizations (slide_id, locale, headline, body, cta_label, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)`).run(slideId, locale, headline, body, ctaLabel, (0, time_1.nowIso)(), (0, time_1.nowIso)());
                }
            });
        }
    });
};
exports.seedDatabase = seedDatabase;
