import { json, requireDb } from '../_lib/db.js';
import { requireAuth } from '../_lib/auth.js';
import { ensureSystemLogStore, listSystemLogs, writeErrorLog } from '../_lib/systemLogs.js';

export async function onRequestGet({ request, env }) {
  const db = requireDb(env);

  try {
    const unauthorized = await requireAuth(request, env);
    if (unauthorized) return unauthorized;

    await ensureSystemLogStore(db);

    const url = new URL(request.url);
    const levels = (url.searchParams.get('levels') || url.searchParams.get('level') || '')
      .split(',')
      .map((level) => level.trim())
      .filter(Boolean);
    const limit = url.searchParams.get('limit') || '20';

    const logs = await listSystemLogs(db, { levels, limit });
    return json({ data: logs });
  } catch (error) {
    await writeErrorLog(db, error, { message: '系统日志读取失败', category: 'system-logs' });
    return json({ error: error.message }, { status: 500 });
  }
}
