// Progressive IP-based login lock:
//   1st 5 failures from same IP  → lock 1 minute
//   2nd 5 failures (after lock)  → lock 10 minutes
//   3rd+ 5 failures              → lock 100 minutes
// Success resets the tier for that IP.

const FAILURES_PER_TIER = 5;
const LOCK_DURATIONS_MS = [
  1 * 60 * 1000,    // tier 1: 1 minute
  10 * 60 * 1000,   // tier 2: 10 minutes
  100 * 60 * 1000,  // tier 3+: 100 minutes
];

export async function ensureLoginLockStore(db) {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS login_ip_lock (
      ip TEXT PRIMARY KEY,
      failed_count INTEGER NOT NULL DEFAULT 0,
      lock_tier INTEGER NOT NULL DEFAULT 0,
      locked_until INTEGER NOT NULL DEFAULT 0,
      last_failure_at INTEGER NOT NULL DEFAULT 0,
      updated_at INTEGER NOT NULL DEFAULT 0
    )
  `).run();
  // Drop legacy table from previous implementation
  await db.prepare('DROP TABLE IF EXISTS login_attempts').run().catch(() => {});
}

function normalizeIp(ip) {
  return String(ip || '').trim() || 'unknown';
}

function lockDurationMs(tier) {
  // tier starts at 1 after first lockout
  const idx = Math.min(Math.max(tier - 1, 0), LOCK_DURATIONS_MS.length - 1);
  return LOCK_DURATIONS_MS[idx];
}

function formatDuration(ms) {
  const totalSeconds = Math.ceil(ms / 1000);
  if (totalSeconds < 60) return `${totalSeconds} 秒`;
  const totalMinutes = Math.ceil(totalSeconds / 60);
  if (totalMinutes < 60) return `${totalMinutes} 分钟`;
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  return mins > 0 ? `${hours} 小时 ${mins} 分钟` : `${hours} 小时`;
}

function lockPayload(lockedUntil, tier) {
  const now = Date.now();
  const remainingMs = Math.max(Number(lockedUntil || 0) - now, 1000);
  const retryAfter = Math.ceil(remainingMs / 1000);
  return {
    success: false,
    locked: true,
    retryAfter,
    lockedUntil,
    tier,
    message: `登录失败次数过多，IP 已被锁定 ${formatDuration(remainingMs)}`,
  };
}

export async function getIpLock(db, ip) {
  await ensureLoginLockStore(db);
  const key = normalizeIp(ip);
  const row = await db
    .prepare('SELECT failed_count, lock_tier, locked_until, last_failure_at FROM login_ip_lock WHERE ip = ?')
    .bind(key)
    .first();

  if (!row) return null;

  // If currently locked, return lock info
  if (Number(row.locked_until || 0) > Date.now()) {
    return lockPayload(row.locked_until, row.lock_tier);
  }

  return null;
}

export async function recordIpFailure(db, ip) {
  await ensureLoginLockStore(db);
  const key = normalizeIp(ip);
  const now = Date.now();

  const row = await db
    .prepare('SELECT failed_count, lock_tier, locked_until FROM login_ip_lock WHERE ip = ?')
    .bind(key)
    .first();

  let failedCount = Number(row?.failed_count || 0);
  let lockTier = Number(row?.lock_tier || 0);
  const lockedUntil = Number(row?.locked_until || 0);

  // If previous lock expired, reset failed_count for new window
  if (lockedUntil > 0 && lockedUntil <= now) {
    failedCount = 0;
  }

  failedCount += 1;

  let newLockedUntil = 0;
  let newTier = lockTier;

  if (failedCount >= FAILURES_PER_TIER) {
    // Advance to next tier and lock
    newTier = lockTier + 1;
    newLockedUntil = now + lockDurationMs(newTier);
    failedCount = 0;
  }

  await db
    .prepare(`
      INSERT INTO login_ip_lock (ip, failed_count, lock_tier, locked_until, last_failure_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(ip) DO UPDATE SET
        failed_count = excluded.failed_count,
        lock_tier = excluded.lock_tier,
        locked_until = excluded.locked_until,
        last_failure_at = excluded.last_failure_at,
        updated_at = excluded.updated_at
    `)
    .bind(key, failedCount, newTier, newLockedUntil, now, now)
    .run();

  if (newLockedUntil > now) {
    return lockPayload(newLockedUntil, newTier);
  }

  return {
    success: false,
    locked: false,
    remainingAttempts: FAILURES_PER_TIER - failedCount,
    message: `用户名或密码错误，还可尝试 ${FAILURES_PER_TIER - failedCount} 次`,
  };
}

export async function clearIpLock(db, ip) {
  await ensureLoginLockStore(db);
  const key = normalizeIp(ip);
  await db
    .prepare('DELETE FROM login_ip_lock WHERE ip = ?')
    .bind(key)
    .run();
}
