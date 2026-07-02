import { json, readJson } from '../_lib/db.js';
import { sessionToken } from '../_lib/auth.js';
import { ensureAccountStore, getAccountByCredentials, loginUser } from '../_lib/accounts.js';
import { requireDb } from '../_lib/db.js';
import { clearLoginFailures, getLoginLock, recordLoginFailure } from '../_lib/loginLock.js';
import { writeErrorLog, writeSystemLog } from '../_lib/systemLogs.js';

export async function onRequestPost({ request, env }) {
  try {
    const { username, password } = await readJson(request);
    const adminUsername = String(username || '').trim();
    const db = requireDb(env);
    await ensureAccountStore(db, env);

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
      });

      return json({
        success: true,
        token: sessionToken(account),
        user: loginUser(account),
      });
    }

    const failure = await recordLoginFailure(db, 'admin', adminUsername);
    await writeSystemLog(db, {
      level: 'warning',
      category: 'auth',
      message: `管理员登录失败：${adminUsername || '空账号'}`,
      actor: 'anonymous',
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
      await writeErrorLog(db, error, { message: '管理员登录接口异常', category: 'auth' });
    } catch {}

    return json({ success: false, message: error.message }, { status: 500 });
  }
}
