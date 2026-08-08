import { json, readJson } from '../_lib/db.js';
import { sessionToken } from '../_lib/auth.js';
import { ensureAccountStore, getAccountByCredentials, loginUser } from '../_lib/accounts.js';
import { requireDb } from '../_lib/db.js';
import { clearIpLock, getIpLock, recordIpFailure } from '../_lib/loginLock.js';
import { getClientIp, writeErrorLog, writeSystemLog } from '../_lib/systemLogs.js';

export async function onRequestPost({ request, env }) {
  try {
    const { username, password } = await readJson(request);
    const adminUsername = String(username || '').trim();
    const ip = getClientIp(request);
    const db = requireDb(env);
    await ensureAccountStore(db, env);

    // IP-based rate limiting (progressive lockout)
    const lock = await getIpLock(db, ip);
    if (lock) return json(lock, { status: 429 });

    const account = await getAccountByCredentials(db, adminUsername, password);
    if (account) {
      await clearIpLock(db, ip);

      await writeSystemLog(db, {
        level: 'success',
        category: 'auth',
        message: `管理员登录成功：${account.username}`,
        actor: account.username,
        ip,
      });

      return json({
        success: true,
        token: await sessionToken(account, env),
        user: loginUser(account),
      });
    }

    const failure = await recordIpFailure(db, ip);

    await writeSystemLog(db, {
      level: 'warning',
      category: 'auth',
      message: `管理员登录失败：${adminUsername || '空账号'}`,
      actor: 'anonymous',
      ip,
    });

    if (failure.locked) return json(failure, { status: 429 });

    return json({
      success: false,
      message: failure.message,
      remainingAttempts: failure.remainingAttempts,
    }, { status: 401 });
  } catch (error) {
    try {
      const db = requireDb(env);
      await writeErrorLog(db, error, { message: '管理员登录接口异常', category: 'auth', ip: getClientIp(request) });
    } catch {}

    return json({ success: false, message: error.message }, { status: 500 });
  }
}
