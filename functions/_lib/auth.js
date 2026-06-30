import { json } from './db.js';

export function sessionToken(env) {
  return `student-os:${env.ADMIN_PASSWORD || '123456'}`;
}

export function isAuthorized(request, env) {
  const header = request.headers.get('Authorization') || '';
  return header === `Bearer ${sessionToken(env)}`;
}

export function requireAuth(request, env) {
  if (isAuthorized(request, env)) return null;
  return json({ error: '未登录或登录已过期' }, { status: 401 });
}
