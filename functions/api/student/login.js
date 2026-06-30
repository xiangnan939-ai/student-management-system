import { ensureDatabase, json, readJson, requireDb } from '../../_lib/db.js';
import { studentSessionToken } from '../../_lib/auth.js';
import { writeErrorLog, writeSystemLog } from '../../_lib/systemLogs.js';

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
      await writeSystemLog(db, {
        level: 'warning',
        category: 'auth',
        message: `学生登录失败：${studentId || '空学号'}`,
        actor: 'anonymous',
      });

      return json({ success: false, message: '学号或密码错误' }, { status: 401 });
    }

    await writeSystemLog(db, {
      level: 'success',
      category: 'auth',
      message: `学生登录成功：${student.id} ${student.name}`,
      actor: student.id,
    });

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
    try {
      const db = requireDb(env);
      await writeErrorLog(db, error, { message: '学生登录接口异常', category: 'auth' });
    } catch {}

    return json({ success: false, message: error.message }, { status: 500 });
  }
}
