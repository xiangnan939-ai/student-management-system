import { json, readJson, requireDb } from '../../_lib/db.js';
import { requireUser } from '../../_lib/auth.js';
import { ensureAccountStore, loginUser } from '../../_lib/accounts.js';
import { validateThemeInput } from '../../_lib/themes.js';
import { getClientIp, writeErrorLog, writeSystemLog } from '../../_lib/systemLogs.js';

export async function onRequestPut({ request, env }) {
  try {
    const auth = await requireUser(request, env);
    if (auth.response) return auth.response;

    const input = await readJson(request);
    const { theme, error } = validateThemeInput(input);
    if (error) return json({ error }, { status: 400 });

    const db = requireDb(env);
    await ensureAccountStore(db, env);

    const updated = await db
      .prepare('UPDATE accounts SET theme = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? RETURNING id, username, password, theme, created_at, updated_at')
      .bind(theme, auth.account.id)
      .first();

    await writeSystemLog(db, {
      level: 'success',
      category: 'account',
      message: `管理员更换主题：${updated.username}`,
      actor: updated.username,
      ip: getClientIp(request),
    });

    return json({
      message: '主题已保存',
      user: loginUser(updated),
    });
  } catch (error) {
    try {
      const db = requireDb(env);
      await writeErrorLog(db, error, { message: '管理员更换主题失败', category: 'account', ip: getClientIp(request) });
    } catch {}

    return json({ error: error.message }, { status: 500 });
  }
}
