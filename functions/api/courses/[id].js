import { ensureCourseStore, json, readJson, requireDb, validateCourse } from '../../_lib/db.js';
import { requireUser } from '../../_lib/auth.js';
import { writeErrorLog, writeSystemLog } from '../../_lib/systemLogs.js';

export async function onRequestPut({ request, env, params }) {
  try {
    const auth = await requireUser(request, env);
    if (auth.response) return auth.response;

    const input = await readJson(request);
    const { course, error } = validateCourse(input);
    if (error) return json({ error }, { status: 400 });

    const db = requireDb(env);
    await ensureCourseStore(db);

    const selected = await db
      .prepare('SELECT COUNT(*) AS count FROM student_courses WHERE course_id = ?')
      .bind(params.id)
      .first();

    if (Number(selected?.count || 0) > course.capacity) {
      return json({ error: '人数上限不能小于当前已选人数' }, { status: 400 });
    }

    const updated = await db
      .prepare(`
        UPDATE courses
        SET name = ?, teacher = ?, time = ?, location = ?, credit = ?, capacity = ?, description = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
        RETURNING id, name, teacher, time, location, credit, capacity, description, created_at, updated_at
      `)
      .bind(course.name, course.teacher, course.time, course.location, course.credit, course.capacity, course.description, params.id)
      .first();

    if (!updated) return json({ error: '课程不存在' }, { status: 404 });
    await writeSystemLog(db, {
      level: 'success',
      category: 'course',
      message: `更新课程：${updated.name}`,
      actor: auth.account.username,
    });

    return json({ message: '更新成功', course: { ...updated, selected_count: selected?.count || 0 } });
  } catch (error) {
    try {
      const db = requireDb(env);
      await writeErrorLog(db, error, { message: '更新课程失败', category: 'course' });
    } catch {}

    return json({ error: error.message }, { status: 500 });
  }
}

export async function onRequestDelete({ request, env, params }) {
  try {
    const auth = await requireUser(request, env);
    if (auth.response) return auth.response;

    const db = requireDb(env);
    await ensureCourseStore(db);

    const course = await db.prepare('SELECT name FROM courses WHERE id = ?').bind(params.id).first();
    await db.prepare('DELETE FROM student_courses WHERE course_id = ?').bind(params.id).run();
    const result = await db.prepare('DELETE FROM courses WHERE id = ?').bind(params.id).run();
    if (!result.meta?.changes) return json({ error: '课程不存在' }, { status: 404 });

    await writeSystemLog(db, {
      level: 'warning',
      category: 'course',
      message: `删除课程：${course?.name || params.id}`,
      actor: auth.account.username,
    });

    return json({ message: '删除成功' });
  } catch (error) {
    try {
      const db = requireDb(env);
      await writeErrorLog(db, error, { message: '删除课程失败', category: 'course' });
    } catch {}

    return json({ error: error.message }, { status: 500 });
  }
}
