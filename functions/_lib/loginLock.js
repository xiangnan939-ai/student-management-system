const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MS = 60 * 1000;

export async function ensureLoginAttemptStore(db) {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS login_attempts (
      scope TEXT NOT NULL,
      identifier TEXT NOT NULL,
      failed_count INTEGER NOT NULL DEFAULT 0,
      locked_until INTEGER NOT NULL DEFAULT 0,
      updated_at INTEGER NOT NULL,
      PRIMARY KEY (scope, identifier)
    )
  `).run();
}

function normalizeIdentifier(identifier) {
  return String(identifier || '').trim() || 'anonymous';
}

function lockPayload(lockedUntil) {
  const retryAfter = Math.max(Math.ceil((Number(lockedUntil || 0) - Date.now()) / 1000), 1);
  return {
    success: false,
    locked: true,
    retryAfter,
    lockedUntil,
    message: `密码错误次数过多，请 ${retryAfter} 秒后再试`,
  };
}

export async function getLoginLock(db, scope, identifier) {
  await ensureLoginAttemptStore(db);

  const row = await db
    .prepare('SELECT failed_count, locked_until FROM login_attempts WHERE scope = ? AND identifier = ?')
    .bind(scope, normalizeIdentifier(identifier))
    .first();

  if (Number(row?.locked_until || 0) > Date.now()) {
    return lockPayload(row.locked_until);
  }

  return null;
}

export async function recordLoginFailure(db, scope, identifier) {
  await ensureLoginAttemptStore(db);

  const key = normalizeIdentifier(identifier);
  const now = Date.now();
  const row = await db
    .prepare('SELECT failed_count, locked_until FROM login_attempts WHERE scope = ? AND identifier = ?')
    .bind(scope, key)
    .first();

  const existingLockedUntil = Number(row?.locked_until || 0);
  const previousCount = existingLockedUntil > 0 && existingLockedUntil <= now ? 0 : Number(row?.failed_count || 0);
  const failedCount = previousCount + 1;
  const lockedUntil = failedCount >= MAX_FAILED_ATTEMPTS ? now + LOCK_DURATION_MS : 0;

  await db
    .prepare(`
      INSERT INTO login_attempts (scope, identifier, failed_count, locked_until, updated_at)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(scope, identifier)
      DO UPDATE SET
        failed_count = excluded.failed_count,
        locked_until = excluded.locked_until,
        updated_at = excluded.updated_at
    `)
    .bind(scope, key, failedCount, lockedUntil, now)
    .run();

  if (lockedUntil > now) return lockPayload(lockedUntil);

  return {
    success: false,
    locked: false,
    remainingAttempts: Math.max(MAX_FAILED_ATTEMPTS - failedCount, 0),
  };
}

export async function clearLoginFailures(db, scope, identifier) {
  await ensureLoginAttemptStore(db);

  await db
    .prepare('DELETE FROM login_attempts WHERE scope = ? AND identifier = ?')
    .bind(scope, normalizeIdentifier(identifier))
    .run();
}
