import { json, readJson, requireDb } from '../../_lib/db.js';
import { requireRootAdmin, requireUser } from '../../_lib/auth.js';
import {
  createAccount,
  ensureAccountStore,
  listAccounts,
  publicAccount,
  validateAccountInput,
} from '../../_lib/accounts.js';
import { writeErrorLog, writeSystemLog } from '../../_lib/systemLogs.js';

export async function onRequestGet({ request, env }) {
  try {
    const auth = await requireRootAdmin(request, env);
    if (auth.response) return auth.response;

    const db = requireDb(env);
    await ensureAccountStore(db, env);

    const accounts = await listAccounts(db);
    return json({ data: accounts.map(publicAccount) });
  } catch (error) {
    return json({ error: error.message }, { status: 500 });
  }
}

export async function onRequestPost({ request, env }) {
  try {
    const auth = await requireUser(request, env);
    if (auth.response) return auth.response;

    const db = requireDb(env);
    await ensureAccountStore(db, env);

    const input = await readJson(request);
    const { account, error } = validateAccountInput(input);
    if (error) return json({ error }, { status: 400 });

    const created = await createAccount(db, account);
    await writeSystemLog(db, {
      level: 'success',
      category: 'account',
      message: `新增管理员账号：${created.username}`,
      actor: auth.account?.username || 'admin',
    });

    return json({ message: '保存成功', account: publicAccount(created) }, { status: 201 });
  } catch (error) {
    try {
      const db = requireDb(env);
      await writeErrorLog(db, error, { message: '新增管理员账号失败', category: 'account' });
    } catch {}

    const message = String(error.message || '');
    const status = message.includes('UNIQUE') ? 409 : 500;
    return json({ error: status === 409 ? '该账号已存在' : error.message }, { status });
  }
}
