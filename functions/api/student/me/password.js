import { ensureDatabase, json, readJson, requireDb } from '../../../_lib/db.js';
import { requireStudent, studentSessionToken } from '../../../_lib/auth.js';
import { writeErrorLog, writeSystemLog } from '../../../_lib/systemLogs.js';

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

    const updated = await db
      .prepare(`
        UPDATE students
        SET password = ?, password_changed_at = CURRENT_TIMESTAMP
        WHERE id = ?
        RETURNING id, name, gender, age, major, phone, password, password_changed_at
      `)
      .bind(nextPassword, auth.student.id)
      .first();

    await writeSystemLog(db, {
      level: 'success',
      category: 'student',
      message: `学生修改登录密码：${updated.id} ${updated.name}`,
      actor: updated.id,
    });

    return json({
      message: '密码已修改',
      token: studentSessionToken(updated),
      user: {
        role: 'student',
        id: updated.id,
        username: updated.id,
        name: updated.name,
      },
    });
  } catch (error) {
    try {
      const db = requireDb(env);
      await writeErrorLog(db, error, { message: '学生修改密码失败', category: 'student' });
    } catch {}

    return json({ error: error.message }, { status: 500 });
  }
}
