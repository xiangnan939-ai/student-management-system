import { json } from './db.js';
import {
  ensureAccountStore,
  getAccountByCredentials,
  getAccountByUsername,
  loginUser,
} from './accounts.js';
import { requireDb } from './db.js';

const TOKEN_PREFIX = 'student-os:';

function base64UrlEncode(value) {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(value) {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));

  return new TextDecoder().decode(bytes);
}

export function sessionToken(account) {
  return `${TOKEN_PREFIX}${base64UrlEncode(JSON.stringify({
    username: account.username,
    password: account.password,
  }))}`;
}

function readBearerToken(request) {
  const header = request.headers.get('Authorization') || '';
  return header.startsWith('Bearer ') ? header.slice(7) : '';
}

function readTokenPayload(token) {
  if (!token.startsWith(TOKEN_PREFIX)) return null;

  try {
    return JSON.parse(base64UrlDecode(token.slice(TOKEN_PREFIX.length)));
  } catch {
    return null;
  }
}

async function readLegacyAdminToken(token, env, db) {
  const legacy = `${TOKEN_PREFIX}${env.ADMIN_PASSWORD || '123456'}`;
  if (token !== legacy) return null;
  return getAccountByUsername(db, env.ADMIN_USER || 'admin');
}

export async function authenticatedAccount(request, env) {
  const db = requireDb(env);
  await ensureAccountStore(db, env);

  const token = readBearerToken(request);
  if (!token) return null;

  const payload = readTokenPayload(token);
  if (payload?.username && payload?.password) {
    return getAccountByCredentials(db, payload.username, payload.password);
  }

  return readLegacyAdminToken(token, env, db);
}

export async function requireAuth(request, env) {
  const account = await authenticatedAccount(request, env);
  if (account) return null;
  return json({ error: '未登录或登录已过期' }, { status: 401 });
}

export async function requireUser(request, env) {
  const account = await authenticatedAccount(request, env);
  if (!account) {
    return { response: json({ error: '未登录或登录已过期' }, { status: 401 }) };
  }

  return { account, user: loginUser(account) };
}

export async function requireRootAdmin(request, env) {
  const auth = await requireUser(request, env);
  if (auth.response) return auth;

  if (auth.account.username !== 'admin') {
    return { response: json({ error: '仅 admin 账户可以访问' }, { status: 403 }) };
  }

  return auth;
}
