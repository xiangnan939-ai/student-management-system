import { json, readJson, requireDb } from '../../_lib/db.js';
import { requireUser, sessionToken } from '../../_lib/auth.js';
import { ensureAccountStore, loginUser, updateAccountPassword } from '../../_lib/accounts.js';
import { writeErrorLog, writeSystemLog } from '../../_lib/systemLogs.js';

export async function onRequestPut({ request, env }) {
  try {
    const auth = await requireUser(request, env);
    if (auth.response) return auth.response;

    const { password } = await readJson(request);
    const nextPassword = String(password || '').trim();
    if (!nextPassword) return json({ error: '请输入新密码' }, { status: 400 });
    if (nextPassword.length > 128) return json({ error: '密码不能超过 128 个字符' }, { status: 400 });

    const db = requireDb(env);
    await ensureAccountStore(db, env);

    const updated = await updateAccountPassword(db, auth.account.id, nextPassword);
    await writeSystemLog(db, {
      level: 'success',
      category: 'account',
      message: `管理员修改自己的密码：${updated.username}`,
      actor: updated.username,
    });

    return json({
      message: '密码已修改',
      token: sessionToken(updated),
      user: loginUser(updated),
    });
  } catch (error) {
    try {
      const db = requireDb(env);
      await writeErrorLog(db, error, { message: '管理员修改密码失败', category: 'account' });
    } catch {}

    return json({ error: error.message }, { status: 500 });
  }
}
