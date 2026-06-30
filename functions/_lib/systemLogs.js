const LOG_LEVELS = new Set(['info', 'success', 'warning', 'error', 'crash']);

export async function ensureSystemLogStore(db) {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS system_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      level TEXT NOT NULL DEFAULT 'info',
      category TEXT NOT NULL DEFAULT 'system',
      message TEXT NOT NULL,
      detail TEXT,
      actor TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `).run();
}

export async function writeSystemLog(db, input) {
  try {
    await ensureSystemLogStore(db);

    const level = LOG_LEVELS.has(input.level) ? input.level : 'info';
    const category = String(input.category || 'system').trim();
    const message = String(input.message || '').trim();
    const detail = input.detail ? String(input.detail).slice(0, 4000) : '';
    const actor = input.actor ? String(input.actor).trim() : 'system';

    if (!message) return;

    await db
      .prepare(`
        INSERT INTO system_logs (level, category, message, detail, actor)
        VALUES (?, ?, ?, ?, ?)
      `)
      .bind(level, category, message, detail, actor)
      .run();
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
  });
}

export async function listSystemLogs(db, options = {}) {
  await ensureSystemLogStore(db);

  const limit = Math.min(Math.max(Number.parseInt(options.limit || '20', 10), 1), 100);
  const levels = (options.levels || [])
    .map((level) => String(level).trim())
    .filter((level) => LOG_LEVELS.has(level));

  if (levels.length > 0) {
    const placeholders = levels.map(() => '?').join(', ');
    const rows = await db
      .prepare(`
        SELECT id, level, category, message, detail, actor, created_at
        FROM system_logs
        WHERE level IN (${placeholders})
        ORDER BY id DESC
        LIMIT ?
      `)
      .bind(...levels, limit)
      .all();

    return rows.results || [];
  }

  const rows = await db
    .prepare(`
      SELECT id, level, category, message, detail, actor, created_at
      FROM system_logs
      ORDER BY id DESC
      LIMIT ?
    `)
    .bind(limit)
    .all();

  return rows.results || [];
}
