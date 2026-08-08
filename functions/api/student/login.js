import { ensureDatabase, json, readJson, requireDb } from '../../_lib/db.js';
import { studentSessionToken } from '../../_lib/auth.js';
import { clearIpLock, getIpLock, recordIpFailure } from '../../_lib/loginLock.js';
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

    // IP-based rate limiting (progressive lockout)
    const lock = await getIpLock(db, ip);
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
      const failure = await recordIpFailure(db, ip);

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
        message: failure.message,
        remainingAttempts: failure.remainingAttempts,
      }, { status: 401 });
    }

    await clearIpLock(db, ip);

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
