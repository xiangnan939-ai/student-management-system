const LOG_LEVELS = new Set(['info', 'success', 'warning', 'error', 'crash']);
const BEIJING_TIME_ZONE = 'Asia/Shanghai';
const LOG_RETENTION_DAYS = 7;

function datePartsInBeijing(date) {
  const parts = new Intl.DateTimeFormat('zh-CN', {
    timeZone: BEIJING_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    hourCycle: 'h23',
  }).formatToParts(date);

  return Object.fromEntries(parts.map((part) => [part.type, part.value]));
}

export function currentBeijingTimestamp() {
  const parts = datePartsInBeijing(new Date());
  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}:${parts.second} +08:00`;
}

function beijingTimestampDaysAgo(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  const parts = datePartsInBeijing(date);
  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}:${parts.second} +08:00`;
}

export function formatBeijingTimestamp(value) {
  if (!value) return currentBeijingTimestamp();

  const text = String(value).trim();
  if (/[+-]\d{2}:?\d{2}$/.test(text)) {
    return text.replace(/([+-]\d{2})(\d{2})$/, '$1:$2');
  }

  const normalized = text.includes('T') ? text : `${text.replace(' ', 'T')}Z`;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return text;

  const parts = datePartsInBeijing(date);
  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}:${parts.second} +08:00`;
}

export function getClientIp(request) {
  if (!request) return '';
  const headers = request.headers;
  return headers.get('CF-Connecting-IP')
    || headers.get('X-Forwarded-For')?.split(',')[0]?.trim()
    || headers.get('X-Real-IP')
    || '';
}

export async function ensureSystemLogStore(db) {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS system_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      level TEXT NOT NULL DEFAULT 'info',
      category TEXT NOT NULL DEFAULT 'system',
      message TEXT NOT NULL,
      detail TEXT,
      actor TEXT,
      ip TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

  const columns = await db.prepare('PRAGMA table_info(system_logs)').all();
  const columnNames = new Set((columns.results || []).map((col) => col.name));

  if (!columnNames.has('ip')) {
    await db.prepare('ALTER TABLE system_logs ADD COLUMN ip TEXT').run();
  }

  await db.prepare('CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at)').run();
}

async function purgeOldLogs(db) {
  try {
    const cutoff = beijingTimestampDaysAgo(LOG_RETENTION_DAYS);
    await db.prepare('DELETE FROM system_logs WHERE created_at < ?').bind(cutoff).run();
  } catch {
    // Best-effort cleanup; never block logging.
  }
}

export async function writeSystemLog(db, input) {
  try {
    await ensureSystemLogStore(db);

    const level = LOG_LEVELS.has(input.level) ? input.level : 'info';
    const category = String(input.category || 'system').trim();
    const message = String(input.message || '').trim();
    const detail = input.detail ? String(input.detail).slice(0, 4000) : '';
    const actor = input.actor ? String(input.actor).trim() : 'system';
    const ip = input.ip ? String(input.ip).trim() : '';
    const createdAt = currentBeijingTimestamp();

    if (!message) return;

    await db
      .prepare(`
        INSERT INTO system_logs (level, category, message, detail, actor, ip, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(level, category, message, detail, actor, ip, createdAt)
      .run();

    purgeOldLogs(db);
  } catch {
    // Logging should never break the user-facing operation.
  }
}

export async function writeErrorLog(db, error, input = {}) {
  await writeSystemLog(db, {
    level: input.level || 'error',
    category: input.category || 'api',
    message: input.message || error?.message || '系统接口异常',
    detail: error?.stack || error?.message || String(error || ''),
    actor: input.actor || 'system',
    ip: input.ip || '',
  });
}

export async function listSystemLogs(db, options = {}) {
  await ensureSystemLogStore(db);

  purgeOldLogs(db);

  const limit = Math.min(Math.max(Number.parseInt(options.limit || '20', 10), 1), 100);
  const levels = (options.levels || [])
    .map((level) => String(level).trim())
    .filter((level) => LOG_LEVELS.has(level));

  if (levels.length > 0) {
    const placeholders = levels.map(() => '?').join(', ');
    const rows = await db
      .prepare(`
        SELECT id, level, category, message, detail, actor, ip, created_at
        FROM system_logs
        WHERE level IN (${placeholders})
        ORDER BY id DESC
        LIMIT ?
      `)
      .bind(...levels, limit)
      .all();

    return (rows.results || []).map((row) => ({
      ...row,
      created_at: formatBeijingTimestamp(row.created_at),
    }));
  }

  const rows = await db
    .prepare(`
      SELECT id, level, category, message, detail, actor, ip, created_at
      FROM system_logs
      ORDER BY id DESC
      LIMIT ?
    `)
    .bind(limit)
    .all();

  return (rows.results || []).map((row) => ({
    ...row,
    created_at: formatBeijingTimestamp(row.created_at),
  }));
}
