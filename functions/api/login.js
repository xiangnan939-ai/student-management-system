import { json, readJson } from '../_lib/db.js';
import { sessionToken } from '../_lib/auth.js';
import { ensureAccountStore, getAccountByCredentials, loginUser } from '../_lib/accounts.js';
import { requireDb } from '../_lib/db.js';

export async function onRequestPost({ request, env }) {
  try {
    const { username, password } = await readJson(request);
    const db = requireDb(env);
    await ensureAccountStore(db, env);

    const account = await getAccountByCredentials(db, username, password);
    if (account) {
      return json({
        success: true,
        token: sessionToken(account),
        user: loginUser(account),
      });
    }

    return json({ success: false, message: '用户名或密码错误' }, { status: 401 });
  } catch (error) {
    return json({ success: false, message: error.message }, { status: 500 });
  }
}
