import { json, readJson, requireDb } from '../../_lib/db.js';
import { requireRootAdmin } from '../../_lib/auth.js';
import { banIp, listBannedIps } from '../../_lib/loginLock.js';
import { getClientIp, writeErrorLog, writeSystemLog } from '../../_lib/systemLogs.js';

function validateIp(ip) {
  const v = String(ip || '').trim();
  if (!v) return { error: 'IP 地址不能为空' };
  const ipv4 = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (!ipv4.test(v) && !/^[\d.:*a-fA-F]+$/.test(v)) return { error: 'IP 地址格式不正确' };
  return { ip: v };
}

export async function onRequestGet({ request, env }) {
  try {
    const auth = await requireRootAdmin(request, env);
    if (auth.response) return auth.response;

    const db = requireDb(env);
    const bans = await listBannedIps(db);
    return json({ data: bans });
  } catch (error) {
    try {
      const db = requireDb(env);
      await writeErrorLog(db, error, { message: '读取封禁IP列表失败', category: 'security', ip: getClientIp(request) });
    } catch {}
    return json({ error: error.message }, { status: 500 });
  }
}

export async function onRequestPost({ request, env }) {
  try {
    const auth = await requireRootAdmin(request, env);
    if (auth.response) return auth.response;

    const input = await readJson(request);
    const { error, ip } = validateIp(input.ip);
    if (error) return json({ error }, { status: 400 });

    const reason = String(input.reason || '').trim();
    const note = String(input.note || '').trim();
    const durationMinutes = Number(input.durationMinutes) || 0;
    if (durationMinutes < 0) return json({ error: '封禁时长不能为负数' }, { status: 400 });

    const db = requireDb(env);
    const adminIp = getClientIp(request);

    if (ip === adminIp && durationMinutes === 0) {
      return json({ error: '不能永久封禁当前登录IP（会把自己锁在外面），请选择临时封禁' }, { status: 400 });
    }

    const ban = await banIp(db, ip, {
      reason,
      note,
      durationMinutes,
      bannedBy: auth.account.username,
    });

    await writeSystemLog(db, {
      level: 'warning',
      category: 'security',
      message: `封禁IP：${ip}${durationMinutes > 0 ? `（${durationMinutes}分钟）` : '（永久）'}${reason ? ` - ${reason}` : ''}`,
      actor: auth.account.username,
      ip: adminIp,
    });

    return json({ message: 'IP 已封禁', data: ban });
  } catch (error) {
    try {
      const db = requireDb(env);
      await writeErrorLog(db, error, { message: '封禁IP失败', category: 'security', ip: getClientIp(request) });
    } catch {}
    return json({ error: error.message }, { status: 500 });
  }
}
