CREATE TABLE IF NOT EXISTS admin_login_guards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  scope TEXT NOT NULL,
  subject_key TEXT NOT NULL,
  failed_attempts INTEGER NOT NULL DEFAULT 0,
  first_failed_at TEXT,
  last_failed_at TEXT,
  last_success_at TEXT,
  locked_until TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(scope, subject_key)
);
CREATE INDEX IF NOT EXISTS idx_admin_login_guards_scope_key ON admin_login_guards(scope, subject_key);
CREATE INDEX IF NOT EXISTS idx_admin_login_guards_locked_until ON admin_login_guards(locked_until);

CREATE TABLE IF NOT EXISTS admin_login_challenges (
  id TEXT PRIMARY KEY,
  prompt TEXT NOT NULL,
  expected_hash TEXT NOT NULL,
  ip_address TEXT,
  user_agent_hash TEXT,
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 5,
  expires_at TEXT NOT NULL,
  solved_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_admin_login_challenges_expires_at ON admin_login_challenges(expires_at);
