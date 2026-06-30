const ACCOUNT_SELECT = 'id, username, password, created_at, updated_at';

export function isRootAdmin(username) {
  return String(username || '').trim() === 'admin';
}

export function publicAccount(account) {
  return {
    id: account.id,
    username: account.username,
    password: account.password,
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
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

  const adminUsername = env.ADMIN_USER || 'admin';
  const adminPassword = env.ADMIN_PASSWORD || '123456';
  const admin = await getAccountByUsername(db, adminUsername);

  if (!admin) {
    await db
      .prepare('INSERT INTO accounts (username, password) VALUES (?, ?)')
      .bind(adminUsername, adminPassword)
      .run();
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
  await db
    .prepare(`
      UPDATE accounts
      SET username = ?, password = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `)
    .bind(account.username, account.password, id)
    .run();

  return getAccountById(db, id);
}

export async function updateAccountPassword(db, id, password) {
  await db
    .prepare('UPDATE accounts SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .bind(password, id)
    .run();

  return getAccountById(db, id);
}

export async function deleteAccount(db, id) {
  return db.prepare('DELETE FROM accounts WHERE id = ?').bind(id).run();
}
