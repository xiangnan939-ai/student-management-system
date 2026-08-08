import { normalizeTheme } from './themes.js';

const ACCOUNT_SELECT = 'id, username, password, theme, token_sid, created_at, updated_at';

export function isRootAdmin(username) {
  return String(username || '').trim() === 'admin';
}

function generateSid() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}

export function publicAccount(account) {
  return {
    id: account.id,
    username: account.username,
    theme: normalizeTheme(account.theme),
    isAdmin: isRootAdmin(account.username),
    createdAt: account.created_at,
    updatedAt: account.updated_at,
  };
}

export function loginUser(account) {
  return {
    id: account.id,
    username: account.username,
    name: account.username === 'admin' ? 'admin' : account.username,
    theme: normalizeTheme(account.theme),
    isAdmin: isRootAdmin(account.username),
  };
}

export function validateAccountInput(input, { requirePassword = true } = {}) {
  const username = String(input.username || '').trim();
  const password = String(input.password || '').trim();

  if (!username) return { error: '账号不能为空' };
  if (username.length > 64) return { error: '账号不能超过 64 个字符' };
  if (!/^[A-Za-z0-9_.-]+$/.test(username)) {
    return { error: '账号只能包含字母、数字、下划线、点和短横线' };
  }

  if (requirePassword && !password) return { error: '密码不能为空' };
  if (password && password.length > 128) return { error: '密码不能超过 128 个字符' };

  return { account: { username, password } };
}

export async function ensureAccountStore(db, env) {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      theme TEXT NOT NULL DEFAULT 'default',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

  const columns = await db.prepare('PRAGMA table_info(accounts)').all();
  const columnNames = new Set((columns.results || []).map((column) => column.name));
  if (!columnNames.has('theme')) {
    await db.prepare("ALTER TABLE accounts ADD COLUMN theme TEXT NOT NULL DEFAULT 'default'").run();
  }
  if (!columnNames.has('token_sid')) {
    await db.prepare('ALTER TABLE accounts ADD COLUMN token_sid TEXT').run();
  }

  await db.prepare("UPDATE accounts SET theme = 'default' WHERE theme IS NULL OR theme = '' OR theme NOT IN ('default', 'liquid-glass', 'matrix')").run();

  const adminUsername = env.ADMIN_USER || 'admin';
  const adminPassword = env.ADMIN_PASSWORD || 'admin';
  const admin = await getAccountByUsername(db, adminUsername);

  if (!admin) {
    await db
      .prepare('INSERT INTO accounts (username, password) VALUES (?, ?)')
      .bind(adminUsername, adminPassword)
      .run();
  } else if (!env.ADMIN_PASSWORD && adminUsername === 'admin' && admin.password === '123456') {
    await updateAccountPassword(db, admin.id, adminPassword);
  }
}

export async function getAccountByUsername(db, username) {
  return db
    .prepare(`SELECT ${ACCOUNT_SELECT} FROM accounts WHERE username = ?`)
    .bind(String(username || '').trim())
    .first();
}

export async function getAccountById(db, id) {
  return db
    .prepare(`SELECT ${ACCOUNT_SELECT} FROM accounts WHERE id = ?`)
    .bind(id)
    .first();
}

export async function getAccountByCredentials(db, username, password) {
  return db
    .prepare(`SELECT ${ACCOUNT_SELECT} FROM accounts WHERE username = ? AND password = ?`)
    .bind(String(username || '').trim(), String(password || '').trim())
    .first();
}

export async function listAccounts(db) {
  const rows = await db
    .prepare(`SELECT ${ACCOUNT_SELECT} FROM accounts ORDER BY id ASC`)
    .all();

  return rows.results || [];
}

export async function createAccount(db, account) {
  await db
    .prepare('INSERT INTO accounts (username, password) VALUES (?, ?)')
    .bind(account.username, account.password)
    .run();

  return getAccountByUsername(db, account.username);
}

export async function updateAccount(db, id, account) {
  // Rotate token_sid so any existing sessions for this account are invalidated.
  // Callers that want to keep the current device logged in (self-edit) will issue a
  // new token immediately afterwards, which overwrites this kill-sid with a fresh one.
  const killSid = generateSid();
  await db
    .prepare(`
      UPDATE accounts
      SET username = ?, password = ?, token_sid = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `)
    .bind(account.username, account.password, killSid, id)
    .run();

  return getAccountById(db, id);
}

export async function updateAccountPassword(db, id, password) {
  const killSid = generateSid();
  await db
    .prepare('UPDATE accounts SET password = ?, token_sid = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .bind(password, killSid, id)
    .run();

  return getAccountById(db, id);
}

export async function deleteAccount(db, id) {
  return db.prepare('DELETE FROM accounts WHERE id = ?').bind(id).run();
}

export async function updateAccountTokenSid(db, id, sid) {
  await db.prepare('UPDATE accounts SET token_sid = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').bind(sid, id).run();
  return getAccountById(db, id);
}
