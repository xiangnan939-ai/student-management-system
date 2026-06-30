import { json, readJson } from '../_lib/db.js';
import { sessionToken } from '../_lib/auth.js';

export async function onRequestPost({ request, env }) {
  const { username, password } = await readJson(request);
  const adminUser = env.ADMIN_USER || 'admin';
  const adminPassword = env.ADMIN_PASSWORD || '123456';

  if (username === adminUser && password === adminPassword) {
    return json({
      success: true,
      token: sessionToken(env),
      user: { name: '管理员' },
    });
  }

  return json({ success: false, message: '用户名或密码错误' }, { status: 401 });
}
