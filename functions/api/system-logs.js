import { json, requireDb } from '../_lib/db.js';
import { requireAuth } from '../_lib/auth.js';
import { countSystemLogs, deleteSystemLogs, getRequestInfo, listSystemLogs, writeErrorLog, writeSystemLog } from '../_lib/systemLogs.js';

export async function onRequestGet({ request, env }) {
  const db = requireDb(env);
  const reqInfo = getRequestInfo(request);

  try {
    const unauthorized = await requireAuth(request, env);
    if (unauthorized) return unauthorized;

    const url = new URL(request.url);
    const levels = (url.searchParams.get('levels') || url.searchParams.get('level') || '')
      .split(',')
      .map((level) => level.trim())
      .filter(Boolean);
    const page = url.searchParams.get('page') || '1';
    const limit = url.searchParams.get('limit') || '20';
    const keyword = url.searchParams.get('keyword') || '';
    const category = url.searchParams.get('category') || '';
    const actor = url.searchParams.get('actor') || '';
    const paginated = url.searchParams.get('paginated') === 'true';

    const options = {
      levels,
      page,
      limit,
      keyword,
      category,
      actor,
      paginated,
    };

    if (paginated) {
      const [logs, total] = await Promise.all([
        listSystemLogs(db, options),
        countSystemLogs(db, options),
      ]);
      const pageNum = Math.max(Number.parseInt(page, 10), 1);
      const limitNum = Math.min(Math.max(Number.parseInt(limit, 10), 1), 100);
      return json({
        data: logs,
        total,
        page: pageNum,
        totalPages: Math.max(Math.ceil(total / limitNum), 1),
      });
    }

    const logs = await listSystemLogs(db, options);
    return json({ data: logs });
  } catch (error) {
    await writeErrorLog(db, error, { message: '系统日志读取失败', category: 'system-logs', ...reqInfo });
    return json({ error: error.message }, { status: 500 });
  }
}

export async function onRequestDelete({ request, env }) {
  const db = requireDb(env);
  const reqInfo = getRequestInfo(request);

  try {
    const unauthorized = await requireAuth(request, env);
    if (unauthorized) return unauthorized;

    const url = new URL(request.url);
    const levels = (url.searchParams.get('levels') || url.searchParams.get('level') || '')
      .split(',')
      .map((level) => level.trim())
      .filter(Boolean);
    const category = url.searchParams.get('category') || '';

    const options = { levels, category };
    const deleted = await deleteSystemLogs(db, options);

    await writeSystemLog(db, {
      level: 'warning',
      category: 'system-logs',
      message: `清空了${levels.length ? levels.join('/') + '级别' : ''}系统日志，共删除 ${deleted} 条记录`,
    }, request);

    return json({ success: true, deleted });
  } catch (error) {
    await writeErrorLog(db, error, { message: '系统日志删除失败', category: 'system-logs', ...reqInfo });
    return json({ error: error.message }, { status: 500 });
  }
}
