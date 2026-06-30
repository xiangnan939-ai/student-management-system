import { ensureDatabase, json, readJson, requireDb, validateStudent } from '../../_lib/db.js';
import { requireUser } from '../../_lib/auth.js';
import { writeErrorLog, writeSystemLog } from '../../_lib/systemLogs.js';

export async function onRequestPut({ request, env, params }) {
  try {
    const auth = await requireUser(request, env);
    if (auth.response) return auth.response;

    const db = requireDb(env);
    await ensureDatabase(db);

    const input = await readJson(request);
    const { student, error } = validateStudent(input);
    if (error) return json({ error }, { status: 400 });

    const result = await db
      .prepare(`
        UPDATE students
        SET id = ?, name = ?, gender = ?, age = ?, major = ?, phone = ?
        WHERE id = ?
      `)
      .bind(student.id, student.name, student.gender, student.age, student.major, student.phone, params.id)
      .run();

    if (!result.meta?.changes) {
      return json({ error: '未找到该学生记录' }, { status: 404 });
    }

    await writeSystemLog(db, {
      level: 'success',
      category: 'student',
      message: `更新学生档案：${student.id} ${student.name}`,
      actor: auth.account.username,
    });

    return json({ message: '更新成功' });
  } catch (error) {
    try {
      const db = requireDb(env);
      await writeErrorLog(db, error, { message: '更新学生档案失败', category: 'student' });
    } catch {}

    const status = String(error.message).includes('UNIQUE') ? 409 : 500;
    return json({ error: error.message }, { status });
  }
}

export async function onRequestDelete({ request, env, params }) {
  try {
    const auth = await requireUser(request, env);
    if (auth.response) return auth.response;

    const db = requireDb(env);
    await ensureDatabase(db);

    await db.prepare('DELETE FROM students WHERE id = ?').bind(params.id).run();
    await writeSystemLog(db, {
      level: 'warning',
      category: 'student',
      message: `删除学生档案：${params.id}`,
      actor: auth.account.username,
    });

    return json({ message: '删除成功' });
  } catch (error) {
    try {
      const db = requireDb(env);
      await writeErrorLog(db, error, { message: '删除学生档案失败', category: 'student' });
    } catch {}

    return json({ error: error.message }, { status: 500 });
  }
}
