CREATE TABLE IF NOT EXISTS story_submissions (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  email TEXT NOT NULL,
  title TEXT NOT NULL,
  media_type TEXT,
  memory TEXT NOT NULL,
  name TEXT,
  social TEXT,
  feelings TEXT NOT NULL DEFAULT '[]',
  consent TEXT NOT NULL CHECK (consent IN ('yes', 'no')),
  share_anonymously INTEGER NOT NULL DEFAULT 0,
  country_code TEXT,
  country_name TEXT,
  heart_reactions INTEGER NOT NULL DEFAULT 0,
  star_reactions INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  user_agent TEXT,
  reviewed_at TEXT,
  reviewer_notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_story_submissions_created_at
  ON story_submissions (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_story_submissions_status
  ON story_submissions (status);

CREATE TABLE IF NOT EXISTS waitlist_subscribers (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  source TEXT NOT NULL DEFAULT 'goods_cta',
  user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_waitlist_subscribers_created_at
  ON waitlist_subscribers (created_at DESC);
