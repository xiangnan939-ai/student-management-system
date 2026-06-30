import { ensureDatabase, json, readJson, requireDb, validateStudent } from '../../_lib/db.js';
import { requireAuth } from '../../_lib/auth.js';

export async function onRequestPut({ request, env, params }) {
  try {
    const unauthorized = await requireAuth(request, env);
    if (unauthorized) return unauthorized;

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

    return json({ message: '更新成功' });
  } catch (error) {
    const status = String(error.message).includes('UNIQUE') ? 409 : 500;
    return json({ error: error.message }, { status });
  }
}

export async function onRequestDelete({ request, env, params }) {
  try {
    const unauthorized = await requireAuth(request, env);
    if (unauthorized) return unauthorized;

    const db = requireDb(env);
    await ensureDatabase(db);

    await db.prepare('DELETE FROM students WHERE id = ?').bind(params.id).run();
    return json({ message: '删除成功' });
  } catch (error) {
    return json({ error: error.message }, { status: 500 });
  }
}
