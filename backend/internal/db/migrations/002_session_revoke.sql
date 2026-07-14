-- Global session invalidation: tokens issued before this timestamp are rejected.
CREATE TABLE IF NOT EXISTS app_meta (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
