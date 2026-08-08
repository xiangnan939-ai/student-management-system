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

export function getUserAgent(request) {
  if (!request) return '';
  return request.headers.get('User-Agent') || '';
}

export function getRequestInfo(request) {
  if (!request) return { ip: '', userAgent: '', method: '', path: '' };
  const url = new URL(request.url);
  return {
    ip: getClientIp(request),
    userAgent: getUserAgent(request),
    method: request.method || '',
    path: url.pathname || '',
  };
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
      user_agent TEXT,
      target_id TEXT,
      method TEXT,
      path TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

  const columns = await db.prepare('PRAGMA table_info(system_logs)').all();
  const columnNames = new Set((columns.results || []).map((col) => col.name));

  if (!columnNames.has('ip')) {
    await db.prepare('ALTER TABLE system_logs ADD COLUMN ip TEXT').run();
  }
  if (!columnNames.has('user_agent')) {
    await db.prepare('ALTER TABLE system_logs ADD COLUMN user_agent TEXT').run();
  }
  if (!columnNames.has('target_id')) {
    await db.prepare('ALTER TABLE system_logs ADD COLUMN target_id TEXT').run();
  }
  if (!columnNames.has('method')) {
    await db.prepare('ALTER TABLE system_logs ADD COLUMN method TEXT').run();
  }
  if (!columnNames.has('path')) {
    await db.prepare('ALTER TABLE system_logs ADD COLUMN path TEXT').run();
  }

  await db.prepare('CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at)').run();
  await db.prepare('CREATE INDEX IF NOT EXISTS idx_system_logs_level ON system_logs(level)').run();
  await db.prepare('CREATE INDEX IF NOT EXISTS idx_system_logs_category ON system_logs(category)').run();
  await db.prepare('CREATE INDEX IF NOT EXISTS idx_system_logs_actor ON system_logs(actor)').run();
}

async function purgeOldLogs(db) {
  try {
    const cutoff = beijingTimestampDaysAgo(LOG_RETENTION_DAYS);
    await db.prepare('DELETE FROM system_logs WHERE created_at < ?').bind(cutoff).run();
  } catch {
    // Best-effort cleanup; never block logging.
  }
}

function normalizeLogInput(input, request) {
  const reqInfo = request ? getRequestInfo(request) : {};
  return {
    level: LOG_LEVELS.has(input?.level) ? input.level : 'info',
    category: String(input?.category || 'system').trim() || 'system',
    message: String(input?.message || '').trim(),
    detail: input?.detail ? String(input.detail).slice(0, 8000) : '',
    actor: input?.actor ? String(input.actor).trim() : 'system',
    ip: input?.ip || reqInfo.ip || '',
    userAgent: input?.userAgent || reqInfo.userAgent || '',
    targetId: input?.targetId ? String(input.targetId).trim() : '',
    method: input?.method || reqInfo.method || '',
    path: input?.path || reqInfo.path || '',
  };
}

export async function writeSystemLog(db, input, request) {
  try {
    await ensureSystemLogStore(db);

    const log = normalizeLogInput(input, request);
    if (!log.message) return;

    const createdAt = currentBeijingTimestamp();

    await db
      .prepare(`
        INSERT INTO system_logs (level, category, message, detail, actor, ip, user_agent, target_id, method, path, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(log.level, log.category, log.message, log.detail, log.actor, log.ip, log.userAgent, log.targetId, log.method, log.path, createdAt)
      .run();

    purgeOldLogs(db);
  } catch {
    // Logging should never break the user-facing operation.
  }
}

export async function writeErrorLog(db, error, input = {}, request) {
  await writeSystemLog(db, {
    level: input.level || 'error',
    category: input.category || 'api',
    message: input.message || error?.message || '系统接口异常',
    detail: error?.stack || error?.message || String(error || ''),
    actor: input.actor || 'system',
    ip: input.ip,
    userAgent: input.userAgent,
    targetId: input.targetId,
    method: input.method,
    path: input.path,
  }, request);
}

function buildLogQuery(options) {
  const conditions = [];
  const bindings = [];

  if (options.levels?.length) {
    const validLevels = options.levels.filter(l => LOG_LEVELS.has(l));
    if (validLevels.length > 0) {
      conditions.push(`level IN (${validLevels.map(() => '?').join(', ')})`);
      bindings.push(...validLevels);
    }
  }

  if (options.category) {
    conditions.push('category = ?');
    bindings.push(options.category);
  }

  if (options.actor) {
    conditions.push('actor LIKE ?');
    bindings.push(`%${options.actor}%`);
  }

  if (options.keyword) {
    conditions.push('(message LIKE ? OR detail LIKE ? OR ip LIKE ? OR target_id LIKE ?)');
    const kw = `%${options.keyword}%`;
    bindings.push(kw, kw, kw, kw);
  }

  if (options.startDate) {
    conditions.push('created_at >= ?');
    bindings.push(options.startDate);
  }

  if (options.endDate) {
    conditions.push('created_at <= ?');
    bindings.push(options.endDate);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  return { whereClause, bindings };
}

export async function countSystemLogs(db, options = {}) {
  await ensureSystemLogStore(db);
  purgeOldLogs(db);

  const { whereClause, bindings } = buildLogQuery(options);
  const row = await db
    .prepare(`SELECT COUNT(*) AS count FROM system_logs ${whereClause}`)
    .bind(...bindings)
    .first();
  return row?.count || 0;
}

export async function listSystemLogs(db, options = {}) {
  await ensureSystemLogStore(db);
  purgeOldLogs(db);

  const page = Math.max(Number.parseInt(options.page || '1', 10), 1);
  const limit = Math.min(Math.max(Number.parseInt(options.limit || (options.paginated ? '20' : '100'), 10), 1), 100);
  const offset = (page - 1) * limit;

  const { whereClause, bindings } = buildLogQuery(options);

  const rows = await db
    .prepare(`
      SELECT id, level, category, message, detail, actor, ip, user_agent, target_id, method, path, created_at
      FROM system_logs
      ${whereClause}
      ORDER BY id DESC
      LIMIT ? OFFSET ?
    `)
    .bind(...bindings, limit, offset)
    .all();

  return (rows.results || []).map((row) => ({
    ...row,
    created_at: formatBeijingTimestamp(row.created_at),
  }));
}

export async function deleteSystemLogs(db, options = {}) {
  await ensureSystemLogStore(db);

  const { whereClause, bindings } = buildLogQuery(options);
  if (!whereClause) {
    const result = await db.prepare('DELETE FROM system_logs').run();
    return result.meta?.changes || 0;
  }
  const result = await db.prepare(`DELETE FROM system_logs ${whereClause}`).bind(...bindings).run();
  return result.meta?.changes || 0;
}
