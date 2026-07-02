CREATE TABLE IF NOT EXISTS login_attempts (
  scope TEXT NOT NULL,
  identifier TEXT NOT NULL,
  failed_count INTEGER NOT NULL DEFAULT 0,
  locked_until INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (scope, identifier)
);
