import { json, readJson } from '../_lib/db.js';
import { sessionToken } from '../_lib/auth.js';
import { ensureAccountStore, getAccountByCredentials, loginUser } from '../_lib/accounts.js';
import { requireDb } from '../_lib/db.js';
import { clearLoginFailures, getIpLoginLock, getLoginLock, recordIpLoginFailure, recordLoginFailure } from '../_lib/loginLock.js';
import { getClientIp, writeErrorLog, writeSystemLog } from '../_lib/systemLogs.js';

export async function onRequestPost({ request, env }) {
  try {
    const { username, password } = await readJson(request);
    const adminUsername = String(username || '').trim();
    const ip = getClientIp(request);
    const db = requireDb(env);
    await ensureAccountStore(db, env);

    // Check IP-based lock first (defense against distributed brute force)
    const ipLock = await getIpLoginLock(db, ip);
    if (ipLock) return json(ipLock, { status: 429 });

    const lock = await getLoginLock(db, 'admin', adminUsername);
    if (lock) return json(lock, { status: 429 });

    const account = await getAccountByCredentials(db, adminUsername, password);
    if (account) {
      await clearLoginFailures(db, 'admin', adminUsername);

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

    // Record failure per-username AND per-IP
    const failure = await recordLoginFailure(db, 'admin', adminUsername);
    if (ip) await recordIpLoginFailure(db, ip);

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
      message: `用户名或密码错误，还可尝试 ${failure.remainingAttempts} 次`,
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
