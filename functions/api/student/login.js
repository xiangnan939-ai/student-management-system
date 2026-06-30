import { ensureDatabase, json, readJson, requireDb } from '../../_lib/db.js';
import { studentSessionToken } from '../../_lib/auth.js';

export async function onRequestPost({ request, env }) {
  try {
    const { username, password } = await readJson(request);
    const studentId = String(username || '').trim();
    const studentPassword = String(password || '').trim();

    const db = requireDb(env);
    await ensureDatabase(db);

    const student = await db
      .prepare(`
        SELECT id, name, gender, age, major, phone, password, password_changed_at
        FROM students
        WHERE id = ? AND password = ?
      `)
      .bind(studentId, studentPassword)
      .first();

    if (!student) {
      return json({ success: false, message: '学号或密码错误' }, { status: 401 });
    }

    return json({
      success: true,
      token: studentSessionToken(student),
      user: {
        role: 'student',
        id: student.id,
        username: student.id,
        name: student.name,
      },
    });
  } catch (error) {
    return json({ success: false, message: error.message }, { status: 500 });
  }
}
