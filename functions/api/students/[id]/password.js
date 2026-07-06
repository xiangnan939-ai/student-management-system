import { ensureDatabase, json, requireDb } from '../../../_lib/db.js';
import { requireRootAdmin } from '../../../_lib/auth.js';
import { clearLoginFailures } from '../../../_lib/loginLock.js';
import { writeErrorLog, writeSystemLog } from '../../../_lib/systemLogs.js';

const DEFAULT_STUDENT_PASSWORD = '123456';

export async function onRequestPut({ request, env, params }) {
  try {
    const auth = await requireRootAdmin(request, env);
    if (auth.response) return auth.response;

    const db = requireDb(env);
    await ensureDatabase(db);

    const result = await db
      .prepare(`
        UPDATE students
        SET password = ?, password_changed_at = NULL
        WHERE id = ?
      `)
      .bind(DEFAULT_STUDENT_PASSWORD, String(params.id || '').trim())
      .run();

    if (!result.meta?.changes) {
      return json({ error: '未找到该学生账号' }, { status: 404 });
    }

    const student = await db
      .prepare('SELECT id, name, gender, age, major, phone, password_changed_at, theme FROM students WHERE id = ?')
      .bind(String(params.id || '').trim())
      .first();

    await clearLoginFailures(db, 'student', student.id);

    await writeSystemLog(db, {
      level: 'warning',
      category: 'student-account',
      message: `初始化学生密码：${student.id} ${student.name}`,
      actor: auth.account.username,
    });

    return json({
      message: '学生密码已初始化为 123456',
      student,
    });
  } catch (error) {
    try {
      const db = requireDb(env);
      await writeErrorLog(db, error, { message: '初始化学生密码失败', category: 'student-account' });
    } catch {}

    return json({ error: error.message }, { status: 500 });
  }
}
