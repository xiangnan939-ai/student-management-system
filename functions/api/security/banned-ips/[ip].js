import { json, requireDb } from '../../../_lib/db.js';
import { requireRootAdmin } from '../../../_lib/auth.js';
import { unbanIp } from '../../../_lib/loginLock.js';
import { getClientIp, writeErrorLog, writeSystemLog } from '../../../_lib/systemLogs.js';

export async function onRequestDelete({ request, env, params }) {
  try {
    const auth = await requireRootAdmin(request, env);
    if (auth.response) return auth.response;

    const ip = decodeURIComponent(String(params.ip || '').trim());
    if (!ip) return json({ error: 'IP 地址不能为空' }, { status: 400 });

    const db = requireDb(env);
    await unbanIp(db, ip);

    await writeSystemLog(db, {
      level: 'success',
      category: 'security',
      message: `解封IP：${ip}`,
      actor: auth.account.username,
      ip: getClientIp(request),
    });

    return json({ message: 'IP 已解封' });
  } catch (error) {
    try {
      const db = requireDb(env);
      await writeErrorLog(db, error, { message: '解封IP失败', category: 'security', ip: getClientIp(request) });
    } catch {}
    return json({ error: error.message }, { status: 500 });
  }
}
