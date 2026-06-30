import { json, readJson } from '../_lib/db.js';
import { sessionToken } from '../_lib/auth.js';
import { ensureAccountStore, getAccountByCredentials, loginUser } from '../_lib/accounts.js';
import { requireDb } from '../_lib/db.js';
import { writeErrorLog, writeSystemLog } from '../_lib/systemLogs.js';

export async function onRequestPost({ request, env }) {
  try {
    const { username, password } = await readJson(request);
    const db = requireDb(env);
    await ensureAccountStore(db, env);

    const account = await getAccountByCredentials(db, username, password);
    if (account) {
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

    await writeSystemLog(db, {
      level: 'warning',
      category: 'auth',
      message: `管理员登录失败：${String(username || '').trim() || '空账号'}`,
      actor: 'anonymous',
    });

    return json({ success: false, message: '用户名或密码错误' }, { status: 401 });
  } catch (error) {
    try {
      const db = requireDb(env);
      await writeErrorLog(db, error, { message: '管理员登录接口异常', category: 'auth' });
    } catch {}

    return json({ success: false, message: error.message }, { status: 500 });
  }
}
