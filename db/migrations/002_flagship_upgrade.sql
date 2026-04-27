CREATE TABLE IF NOT EXISTS announcements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  status TEXT NOT NULL DEFAULT 'draft',
  variant TEXT NOT NULL DEFAULT 'info',
  priority INTEGER NOT NULL DEFAULT 100,
  sort_order INTEGER NOT NULL DEFAULT 0,
  dismissible INTEGER NOT NULL DEFAULT 0,
  persistent_dismissal_key TEXT,
  cta_url TEXT,
  event_id INTEGER REFERENCES events(id) ON DELETE SET NULL,
  reservation_intent TEXT,
  starts_at TEXT,
  ends_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_announcements_status_schedule ON announcements(status, starts_at, ends_at, priority, sort_order);

CREATE TABLE IF NOT EXISTS announcement_localizations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  announcement_id INTEGER NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
  locale TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  cta_label TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(announcement_id, locale)
);

CREATE TABLE IF NOT EXISTS media_assets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  filename TEXT NOT NULL UNIQUE,
  original_filename TEXT NOT NULL,
  storage_path TEXT NOT NULL UNIQUE,
  mime_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  width INTEGER,
  height INTEGER,
  status TEXT NOT NULL DEFAULT 'ready',
  featured INTEGER NOT NULL DEFAULT 0,
  tags_json TEXT NOT NULL DEFAULT '[]',
  focal_point_x REAL,
  focal_point_y REAL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_media_assets_status_featured ON media_assets(status, featured, created_at DESC);

CREATE TABLE IF NOT EXISTS media_asset_localizations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  media_asset_id INTEGER NOT NULL REFERENCES media_assets(id) ON DELETE CASCADE,
  locale TEXT NOT NULL,
  alt_text TEXT NOT NULL,
  caption TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(media_asset_id, locale)
);

CREATE TABLE IF NOT EXISTS media_collections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS media_collection_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  collection_id INTEGER NOT NULL REFERENCES media_collections(id) ON DELETE CASCADE,
  media_asset_id INTEGER NOT NULL REFERENCES media_assets(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  UNIQUE(collection_id, media_asset_id)
);

CREATE INDEX IF NOT EXISTS idx_media_collection_items_order ON media_collection_items(collection_id, sort_order);

CREATE TABLE IF NOT EXISTS glimpse_groups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  active INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  cover_media_id INTEGER REFERENCES media_assets(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS glimpse_group_localizations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  group_id INTEGER NOT NULL REFERENCES glimpse_groups(id) ON DELETE CASCADE,
  locale TEXT NOT NULL,
  label TEXT NOT NULL,
  title TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(group_id, locale)
);

CREATE TABLE IF NOT EXISTS glimpse_slides (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  group_id INTEGER NOT NULL REFERENCES glimpse_groups(id) ON DELETE CASCADE,
  media_type TEXT NOT NULL,
  media_asset_id INTEGER REFERENCES media_assets(id) ON DELETE SET NULL,
  duration_ms INTEGER NOT NULL DEFAULT 5000,
  overlay_intensity REAL NOT NULL DEFAULT 0.45,
  text_alignment TEXT NOT NULL DEFAULT 'left',
  sort_order INTEGER NOT NULL DEFAULT 0,
  cta_url TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_glimpse_slides_group_order ON glimpse_slides(group_id, sort_order);

CREATE TABLE IF NOT EXISTS glimpse_slide_localizations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slide_id INTEGER NOT NULL REFERENCES glimpse_slides(id) ON DELETE CASCADE,
  locale TEXT NOT NULL,
  headline TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  cta_label TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(slide_id, locale)
);

CREATE TABLE IF NOT EXISTS homepage_modules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  module_key TEXT NOT NULL UNIQUE,
  enabled INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  settings_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_homepage_modules_order ON homepage_modules(sort_order, enabled);

CREATE TABLE IF NOT EXISTS event_media (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  media_asset_id INTEGER NOT NULL REFERENCES media_assets(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  UNIQUE(event_id, media_asset_id)
);

CREATE TABLE IF NOT EXISTS event_tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE(event_id, tag)
);

ALTER TABLE reservations ADD COLUMN intent_type TEXT NOT NULL DEFAULT 'standard';
ALTER TABLE reservations ADD COLUMN event_id INTEGER REFERENCES events(id) ON DELETE SET NULL;

ALTER TABLE events ADD COLUMN category TEXT NOT NULL DEFAULT 'special';
ALTER TABLE events ADD COLUMN timezone TEXT NOT NULL DEFAULT 'Europe/Zagreb';
ALTER TABLE events ADD COLUMN poster_media_id INTEGER REFERENCES media_assets(id) ON DELETE SET NULL;
ALTER TABLE events ADD COLUMN reservation_mode TEXT NOT NULL DEFAULT 'optional';
ALTER TABLE events ADD COLUMN price_label TEXT;
ALTER TABLE events ADD COLUMN linked_announcement_id INTEGER REFERENCES announcements(id) ON DELETE SET NULL;
ALTER TABLE events ADD COLUMN linked_glimpse_group_id INTEGER REFERENCES glimpse_groups(id) ON DELETE SET NULL;
ALTER TABLE event_localizations ADD COLUMN teaser TEXT;

ALTER TABLE menu_items ADD COLUMN secondary_price_label TEXT;
ALTER TABLE menu_items ADD COLUMN availability INTEGER NOT NULL DEFAULT 1;
ALTER TABLE menu_items ADD COLUMN featured INTEGER NOT NULL DEFAULT 0;
ALTER TABLE menu_items ADD COLUMN labels_json TEXT NOT NULL DEFAULT '[]';
ALTER TABLE menu_items ADD COLUMN allergens_json TEXT NOT NULL DEFAULT '[]';
ALTER TABLE menu_items ADD COLUMN media_asset_id INTEGER REFERENCES media_assets(id) ON DELETE SET NULL;
ALTER TABLE menu_items ADD COLUMN book_section TEXT;
ALTER TABLE menu_items ADD COLUMN spread_style TEXT;

CREATE INDEX IF NOT EXISTS idx_events_calendar ON events(status, starts_at, category, featured);
