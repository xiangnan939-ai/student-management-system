import { ensureDatabase, json, readJson, requireDb } from '../../../_lib/db.js';
import { requireStudent, studentSessionToken } from '../../../_lib/auth.js';
import { getClientIp, writeErrorLog, writeSystemLog } from '../../../_lib/systemLogs.js';

function generateSid() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}

export async function onRequestPut({ request, env }) {
  try {
    const auth = await requireStudent(request, env);
    if (auth.response) return auth.response;

    const { password } = await readJson(request);
    const nextPassword = String(password || '').trim();
    if (!nextPassword) return json({ error: '请输入新密码' }, { status: 400 });
    if (nextPassword.length > 128) return json({ error: '密码不能超过 128 个字符' }, { status: 400 });

    const db = requireDb(env);
    await ensureDatabase(db);

    // Rotate to a kill-sid first so other devices are immediately logged out.
    // studentSessionToken below will overwrite this with the new session's sid.
    const killSid = generateSid();

    const updated = await db
      .prepare(`
        UPDATE students
        SET password = ?, password_changed_at = CURRENT_TIMESTAMP, token_sid = ?
        WHERE id = ?
        RETURNING id, name, gender, age, major, phone, password, password_changed_at, theme, token_sid
      `)
      .bind(nextPassword, killSid, auth.student.id)
      .first();

    await writeSystemLog(db, {
      level: 'success',
      category: 'student',
      message: `学生修改登录密码：${updated.id} ${updated.name}`,
      actor: updated.id,
      ip: getClientIp(request),
    });

    return json({
      message: '密码已修改',
      token: await studentSessionToken(updated, env),
      user: {
        role: 'student',
        id: updated.id,
        username: updated.id,
        name: updated.name,
        theme: updated.theme || 'default',
      },
    });
  } catch (error) {
    try {
      const db = requireDb(env);
      await writeErrorLog(db, error, { message: '学生修改密码失败', category: 'student', ip: getClientIp(request) });
    } catch {}

    return json({ error: error.message }, { status: 500 });
  }
}
