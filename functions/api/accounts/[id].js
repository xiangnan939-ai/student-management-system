import { json, readJson, requireDb } from '../../_lib/db.js';
import { requireRootAdmin, sessionToken } from '../../_lib/auth.js';
import {
  ensureAccountStore,
  getAccountById,
  loginUser,
  publicAccount,
  updateAccount,
  validateAccountInput,
} from '../../_lib/accounts.js';

export async function onRequestPut({ request, env, params }) {
  try {
    const auth = await requireRootAdmin(request, env);
    if (auth.response) return auth.response;

    const db = requireDb(env);
    await ensureAccountStore(db, env);

    const existing = await getAccountById(db, params.id);
    if (!existing) return json({ error: '账号不存在' }, { status: 404 });

    const input = await readJson(request);
    const { account, error } = validateAccountInput(input);
    if (error) return json({ error }, { status: 400 });
    if (existing.username === 'admin' && account.username !== 'admin') {
      return json({ error: '初始 admin 账号名称不能修改' }, { status: 400 });
    }

    const updated = await updateAccount(db, params.id, account);
    return json({
      message: '保存成功',
      account: publicAccount(updated),
      ...(String(auth.account.id) === String(params.id)
        ? { token: sessionToken(updated), user: loginUser(updated) }
        : {}),
    });
  } catch (error) {
    const message = String(error.message || '');
    const status = message.includes('UNIQUE') ? 409 : 500;
    return json({ error: status === 409 ? '该账号已存在' : error.message }, { status });
  }
}
