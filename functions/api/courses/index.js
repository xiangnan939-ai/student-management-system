import {
  ensureCourseStore,
  json,
  listCoursesWithCounts,
  readJson,
  requireDb,
  validateCourse,
} from '../../_lib/db.js';
import { requireAuth, requireUser } from '../../_lib/auth.js';
import { writeErrorLog, writeSystemLog } from '../../_lib/systemLogs.js';

export async function onRequestGet({ request, env }) {
  try {
    const unauthorized = await requireAuth(request, env);
    if (unauthorized) return unauthorized;

    const db = requireDb(env);
    const courses = await listCoursesWithCounts(db);
    return json({ data: courses });
  } catch (error) {
    return json({ error: error.message }, { status: 500 });
  }
}

export async function onRequestPost({ request, env }) {
  try {
    const auth = await requireUser(request, env);
    if (auth.response) return auth.response;

    const input = await readJson(request);
    const { course, error } = validateCourse(input);
    if (error) return json({ error }, { status: 400 });

    const db = requireDb(env);
    await ensureCourseStore(db);

    const created = await db
      .prepare(`
        INSERT INTO courses (name, teacher, time, location, credit, capacity, description)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        RETURNING id, name, teacher, time, location, credit, capacity, description, created_at, updated_at
      `)
      .bind(course.name, course.teacher, course.time, course.location, course.credit, course.capacity, course.description)
      .first();

    await writeSystemLog(db, {
      level: 'success',
      category: 'course',
      message: `新增课程：${created.name}`,
      actor: auth.account.username,
    });

    return json({ message: '新增成功', course: { ...created, selected_count: 0 } }, { status: 201 });
  } catch (error) {
    try {
      const db = requireDb(env);
      await writeErrorLog(db, error, { message: '新增课程失败', category: 'course' });
    } catch {}

    return json({ error: error.message }, { status: 500 });
  }
}
