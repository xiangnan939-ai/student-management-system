import { json } from './db.js';
import { ensureDatabase } from './db.js';
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
    role: 'admin',
    username: account.username,
    password: account.password,
  }))}`;
}

export function studentSessionToken(student) {
  return `${TOKEN_PREFIX}${base64UrlEncode(JSON.stringify({
    role: 'student',
    id: student.id,
    password: student.password || '123456',
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
  if ((!payload?.role || payload.role === 'admin') && payload?.username && payload?.password) {
    return getAccountByCredentials(db, payload.username, payload.password);
  }

  return readLegacyAdminToken(token, env, db);
}

export async function authenticatedStudent(request, env) {
  const db = requireDb(env);
  await ensureDatabase(db);

  const token = readBearerToken(request);
  if (!token) return null;

  const payload = readTokenPayload(token);
  if (payload?.role !== 'student' || !payload.id || !payload.password) return null;

  return db
    .prepare(`
      SELECT id, name, gender, age, major, phone, password, password_changed_at
      FROM students
      WHERE id = ? AND password = ?
    `)
    .bind(String(payload.id).trim(), String(payload.password).trim())
    .first();
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

export async function requireStudent(request, env) {
  const student = await authenticatedStudent(request, env);
  if (!student) {
    return { response: json({ error: '学生未登录或登录已过期' }, { status: 401 }) };
  }

  return {
    student,
    user: {
      role: 'student',
      id: student.id,
      username: student.id,
      name: student.name,
    },
  };
}
