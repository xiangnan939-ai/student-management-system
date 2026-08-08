import { currentBeijingTimestamp, formatBeijingTimestamp, getClientIp } from './systemLogs.js';

export async function ensureFeedbackTables(db) {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS feedback (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id TEXT NOT NULL,
      student_name TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'feedback',
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      ip TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

  await db.prepare(`
    CREATE TABLE IF NOT EXISTS feedback_replies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      feedback_id INTEGER NOT NULL,
      admin_username TEXT NOT NULL,
      admin_name TEXT NOT NULL,
      content TEXT NOT NULL,
      ip TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (feedback_id) REFERENCES feedback(id) ON DELETE CASCADE
    )
  `).run();

  const fbCols = await db.prepare('PRAGMA table_info(feedback)').all();
  const fbNames = new Set((fbCols.results || []).map(c => c.name));
  if (!fbNames.has('ip')) await db.prepare('ALTER TABLE feedback ADD COLUMN ip TEXT').run();

  const frCols = await db.prepare('PRAGMA table_info(feedback_replies)').all();
  const frNames = new Set((frCols.results || []).map(c => c.name));
  if (!frNames.has('ip')) await db.prepare('ALTER TABLE feedback_replies ADD COLUMN ip TEXT').run();

  await db.prepare('CREATE INDEX IF NOT EXISTS idx_feedback_student ON feedback(student_id)').run();
  await db.prepare('CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback(status)').run();
  await db.prepare('CREATE INDEX IF NOT EXISTS idx_feedback_created ON feedback(created_at)').run();
  await db.prepare('CREATE INDEX IF NOT EXISTS idx_feedback_replies_fid ON feedback_replies(feedback_id)').run();
}

function rowToFeedback(row) {
  return {
    ...row,
    created_at: formatBeijingTimestamp(row.created_at),
    updated_at: formatBeijingTimestamp(row.updated_at),
  };
}

function rowToReply(row) {
  return {
    ...row,
    created_at: formatBeijingTimestamp(row.created_at),
  };
}

export async function createFeedback(db, { studentId, studentName, type, title, content, ip }) {
  await ensureFeedbackTables(db);
  const now = currentBeijingTimestamp();
  const result = await db.prepare(`
    INSERT INTO feedback (student_id, student_name, type, title, content, status, ip, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, 'pending', ?, ?, ?)
  `).bind(studentId, studentName, type, title, content, ip, now, now).run();

  return result.meta?.last_row_id || result.lastRowId || null;
}

export async function getFeedbackWithReplies(db, id) {
  await ensureFeedbackTables(db);
  const fb = await db.prepare('SELECT * FROM feedback WHERE id = ?').bind(id).first();
  if (!fb) return null;

  const replies = await db.prepare(`
    SELECT * FROM feedback_replies WHERE feedback_id = ? ORDER BY created_at ASC
  `).bind(id).all();

  return {
    ...rowToFeedback(fb),
    replies: (replies.results || []).map(rowToReply),
  };
}

export async function listStudentFeedback(db, studentId) {
  await ensureFeedbackTables(db);
  const rows = await db.prepare(`
    SELECT * FROM feedback WHERE student_id = ? ORDER BY id DESC
  `).bind(studentId).all();

  const feedbacks = [];
  for (const row of rows.results || []) {
    const fb = await getFeedbackWithReplies(db, row.id);
    if (fb) feedbacks.push(fb);
  }
  return feedbacks;
}

export async function listAllFeedback(db, { status = '', unreadOnly = false } = {}) {
  await ensureFeedbackTables(db);

  let query = 'SELECT * FROM feedback';
  const conditions = [];
  const bindings = [];

  if (status) {
    conditions.push('status = ?');
    bindings.push(status);
  }
  if (unreadOnly) {
    conditions.push("status = 'pending'");
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }
  query += ' ORDER BY CASE WHEN status = "pending" THEN 0 ELSE 1 END, id DESC';

  const rows = await db.prepare(query).bind(...bindings).all();

  const feedbacks = [];
  for (const row of rows.results || []) {
    const fb = await getFeedbackWithReplies(db, row.id);
    if (fb) feedbacks.push(fb);
  }
  return feedbacks;
}

export async function countPendingFeedback(db) {
  await ensureFeedbackTables(db);
  const row = await db.prepare("SELECT COUNT(*) AS count FROM feedback WHERE status = 'pending'").first();
  return row?.count || 0;
}

export async function countUnreadReplies(db, studentId) {
  await ensureFeedbackTables(db);
  // Count feedbacks that have replies from admin after the last student view
  // For simplicity, count feedbacks where status is 'replied' (has new reply)
  const row = await db.prepare(`
    SELECT COUNT(*) AS count FROM feedback WHERE student_id = ? AND status = 'replied'
  `).bind(studentId).first();
  return row?.count || 0;
}

export async function addReply(db, { feedbackId, adminUsername, adminName, content, ip }) {
  await ensureFeedbackTables(db);
  const now = currentBeijingTimestamp();

  await db.prepare(`
    INSERT INTO feedback_replies (feedback_id, admin_username, admin_name, content, ip, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(feedbackId, adminUsername, adminName, content, ip, now).run();

  await db.prepare(`
    UPDATE feedback SET status = 'replied', updated_at = ? WHERE id = ?
  `).bind(now, feedbackId).run();
}

export async function markFeedbackClosed(db, id) {
  const now = currentBeijingTimestamp();
  await db.prepare(`UPDATE feedback SET status = 'closed', updated_at = ? WHERE id = ?`).bind(now, id).run();
}

export async function markFeedbackReadByStudent(db, studentId, id) {
  // When student views, mark as closed (they've read the reply)
  const now = currentBeijingTimestamp();
  await db.prepare(`
    UPDATE feedback SET status = 'closed', updated_at = ? WHERE id = ? AND student_id = ? AND status = 'replied'
  `).bind(now, id, studentId).run();
}
