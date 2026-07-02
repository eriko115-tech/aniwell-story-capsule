CREATE TABLE IF NOT EXISTS capsule_submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL,
  title TEXT NOT NULL,
  memory TEXT NOT NULL,
  display_name TEXT,
  social_handle TEXT,
  feelings_json TEXT NOT NULL DEFAULT '[]',
  consent_to_share INTEGER NOT NULL DEFAULT 0,
  approved_for_gallery INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_capsule_submissions_created_at
ON capsule_submissions (created_at DESC);
