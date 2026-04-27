CREATE TABLE IF NOT EXISTS web_vitals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  metric_name TEXT NOT NULL,
  metric_value REAL NOT NULL,
  rating TEXT NOT NULL,
  navigation_type TEXT,
  page_url TEXT NOT NULL,
  locale TEXT,
  user_agent TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_web_vitals_metric_created_at ON web_vitals(metric_name, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_web_vitals_page_created_at ON web_vitals(page_url, created_at DESC);
