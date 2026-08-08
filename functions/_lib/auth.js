import { json } from './db.js';
import { ensureDatabase } from './db.js';
import {
  ensureAccountStore,
  getAccountByUsername,
  loginUser,
  updateAccountTokenSid,
} from './accounts.js';
import { requireDb } from './db.js';
import { normalizeTheme } from './themes.js';

const TOKEN_PREFIX = 'student-os:';
const TOKEN_TTL_SECONDS = 24 * 60 * 60; // 24 hours

const KICKED = Symbol.for('student-os:session-kicked');

function generateSid() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}

function base64UrlEncode(bytes) {
  if (typeof bytes === 'string') {
    const enc = new TextEncoder();
    bytes = enc.encode(bytes);
  }
  let binary = '';
  const uint8 = new Uint8Array(bytes);
  uint8.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(value) {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function getSecretKey(env) {
  const configured = env.JWT_SECRET || env.ADMIN_PASSWORD || 'student-os-default-secret';
  return configured;
}

async function importSecretKey(env) {
  const enc = new TextEncoder();
  const keyData = enc.encode(getSecretKey(env));
  return crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

async function signToken(payload, env) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const headerB64 = base64UrlEncode(JSON.stringify(header));
  const payloadB64 = base64UrlEncode(JSON.stringify(payload));
  const signingInput = `${headerB64}.${payloadB64}`;
  const key = await importSecretKey(env);
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signingInput));
  const sigB64 = base64UrlEncode(new Uint8Array(signature));
  return `${TOKEN_PREFIX}${signingInput}.${sigB64}`;
}

async function verifyAndDecodeToken(token, env) {
  if (!token || !token.startsWith(TOKEN_PREFIX)) return null;
  const parts = token.slice(TOKEN_PREFIX.length).split('.');
  if (parts.length !== 3) return null;

  const [headerB64, payloadB64, sigB64] = parts;
  try {
    const signingInput = `${headerB64}.${payloadB64}`;
    const key = await importSecretKey(env);
    const signature = base64UrlDecode(sigB64);
    const valid = await crypto.subtle.verify('HMAC', key, signature, new TextEncoder().encode(signingInput));
    if (!valid) return null;

    const payload = JSON.parse(new TextDecoder().decode(base64UrlDecode(payloadB64)));
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
    if (!payload.role || !payload.sub) return null;
    return payload;
  } catch {
    return null;
  }
}

function isSessionKicked(result) {
  return result === KICKED;
}

/**
 * Create a new admin session: generates a fresh sid, persists it, signs a token.
 * Any previously issued tokens for this account become invalid (single-device login).
 */
export async function createAdminSession(db, account, env) {
  const sid = generateSid();
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    role: 'admin',
    sub: account.username,
    sid,
    iat: now,
    exp: now + TOKEN_TTL_SECONDS,
  };
  await updateAccountTokenSid(db, account.id, sid);
  return signToken(payload, env);
}

/**
 * Create a new student session: generates a fresh sid, persists it, signs a token.
 */
export async function createStudentSession(db, student, env) {
  const sid = generateSid();
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    role: 'student',
    sub: String(student.id),
    sid,
    iat: now,
    exp: now + TOKEN_TTL_SECONDS,
  };
  await db.prepare('UPDATE students SET token_sid = ? WHERE id = ?').bind(sid, student.id).run();
  return signToken(payload, env);
}

/**
 * @deprecated Use createAdminSession instead (single-device enforcement).
 * Kept for backwards compatibility; tokens issued via this function carry no sid
 * and will be treated as a valid first session until a new login overwrites token_sid.
 */
export async function sessionToken(account, env) {
  const db = requireDb(env);
  return createAdminSession(db, account, env);
}

/**
 * @deprecated Use createStudentSession instead.
 */
export async function studentSessionToken(student, env) {
  const db = requireDb(env);
  return createStudentSession(db, student, env);
}

function readBearerToken(request) {
  const header = request.headers.get('Authorization') || '';
  return header.startsWith('Bearer ') ? header.slice(7) : '';
}

export async function authenticatedAccount(request, env) {
  const db = requireDb(env);
  await ensureAccountStore(db, env);

  const token = readBearerToken(request);
  if (!token) return null;

  const payload = await verifyAndDecodeToken(token, env);
  if (!payload || payload.role !== 'admin' || !payload.sub) return null;

  const account = await getAccountByUsername(db, payload.sub);
  if (!account) return null;

  // Single-device enforcement: if the account has a token_sid recorded,
  // the incoming token must carry the same sid, otherwise it's been superseded.
  // If token_sid is NULL (legacy session pre-migration / no login yet), sid check is skipped.
  if (account.token_sid && payload.sid !== account.token_sid) {
    return KICKED;
  }

  return account;
}

export async function authenticatedStudent(request, env) {
  const db = requireDb(env);
  await ensureDatabase(db);

  const token = readBearerToken(request);
  if (!token) return null;

  const payload = await verifyAndDecodeToken(token, env);
  if (!payload || payload.role !== 'student' || !payload.sub) return null;

  const student = await db
    .prepare(`
      SELECT id, name, gender, age, major, phone, password_changed_at, theme, token_sid
      FROM students
      WHERE id = ?
    `)
    .bind(String(payload.sub).trim())
    .first();
  if (!student) return null;

  if (student.token_sid && payload.sid !== student.token_sid) {
    return KICKED;
  }

  return student;
}

export function decodeTokenPayload(token) {
  if (!token || !token.startsWith(TOKEN_PREFIX)) return null;
  const parts = token.slice(TOKEN_PREFIX.length).split('.');
  if (parts.length < 2) return null;
  try {
    return JSON.parse(new TextDecoder().decode(base64UrlDecode(parts[1])));
  } catch {
    return null;
  }
}

function kickedResponse() {
  return json({ error: '账号已在其他设备登录', code: 'SESSION_KICKED' }, { status: 401 });
}

export async function requireAuth(request, env) {
  const result = await authenticatedAccount(request, env);
  if (isSessionKicked(result)) return kickedResponse();
  if (result) return null;
  return json({ error: '未登录或登录已过期' }, { status: 401 });
}

export async function requireAnyAuth(request, env) {
  const accountResult = await authenticatedAccount(request, env);
  if (isSessionKicked(accountResult)) return { response: kickedResponse() };
  if (accountResult) {
    return { type: 'admin', account: accountResult, user: loginUser(accountResult) };
  }
  const studentResult = await authenticatedStudent(request, env);
  if (isSessionKicked(studentResult)) return { response: kickedResponse() };
  if (studentResult) {
    return {
      type: 'student',
      student: studentResult,
      user: {
        role: 'student',
        id: studentResult.id,
        username: studentResult.id,
        name: studentResult.name,
        theme: normalizeTheme(studentResult.theme),
      },
    };
  }
  return { response: json({ error: '未登录或登录已过期' }, { status: 401 }) };
}

export async function requireUser(request, env) {
  const result = await authenticatedAccount(request, env);
  if (isSessionKicked(result)) return { response: kickedResponse() };
  if (!result) {
    return { response: json({ error: '未登录或登录已过期' }, { status: 401 }) };
  }
  return { account: result, user: loginUser(result) };
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
  const result = await authenticatedStudent(request, env);
  if (isSessionKicked(result)) return { response: kickedResponse() };
  if (!result) {
    return { response: json({ error: '学生未登录或登录已过期' }, { status: 401 }) };
  }
  return {
    student: result,
    user: {
      role: 'student',
      id: result.id,
      username: result.id,
      name: result.name,
      theme: normalizeTheme(result.theme),
    },
  };
}
