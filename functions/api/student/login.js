import { ensureDatabase, json, readJson, requireDb } from '../../_lib/db.js';
import { studentSessionToken } from '../../_lib/auth.js';
import { clearLoginFailures, getLoginLock, recordLoginFailure } from '../../_lib/loginLock.js';
import { getClientIp, writeErrorLog, writeSystemLog } from '../../_lib/systemLogs.js';
import { normalizeTheme } from '../../_lib/themes.js';

export async function onRequestPost({ request, env }) {
  try {
    const { username, password } = await readJson(request);
    const studentId = String(username || '').trim();
    const studentPassword = String(password || '').trim();
    const ip = getClientIp(request);

    const db = requireDb(env);
    await ensureDatabase(db);

    // Per-student-ID rate limiting (5 failures / 60s lock)
    const lock = await getLoginLock(db, 'student', studentId);
    if (lock) return json(lock, { status: 429 });

    const student = await db
      .prepare(`
        SELECT id, name, gender, age, major, phone, password_changed_at, theme
        FROM students
        WHERE id = ? AND password = ?
      `)
      .bind(studentId, studentPassword)
      .first();

    if (!student) {
      const failure = await recordLoginFailure(db, 'student', studentId);

      await writeSystemLog(db, {
        level: 'warning',
        category: 'auth',
        message: `学生登录失败：${studentId || '空学号'}`,
        actor: 'anonymous',
        ip,
      });

      if (failure.locked) return json(failure, { status: 429 });

      return json({
        success: false,
        message: `学号或密码错误，还可尝试 ${failure.remainingAttempts} 次`,
        remainingAttempts: failure.remainingAttempts,
      }, { status: 401 });
    }

    await clearLoginFailures(db, 'student', studentId);

    await writeSystemLog(db, {
      level: 'success',
      category: 'auth',
      message: `学生登录成功：${student.id} ${student.name}`,
      actor: student.id,
      ip,
    });

    return json({
      success: true,
      token: await studentSessionToken(student, env),
      user: {
        role: 'student',
        id: student.id,
        username: student.id,
        name: student.name,
        theme: normalizeTheme(student.theme),
      },
    });
  } catch (error) {
    try {
      const db = requireDb(env);
      await writeErrorLog(db, error, { message: '学生登录接口异常', category: 'auth', ip: getClientIp(request) });
    } catch {}

    return json({ success: false, message: error.message }, { status: 500 });
  }
}
