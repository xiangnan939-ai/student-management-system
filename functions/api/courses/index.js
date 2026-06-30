import {
  ensureCourseStore,
  json,
  listCoursesWithCounts,
  readJson,
  requireDb,
  validateCourse,
} from '../../_lib/db.js';
import { requireAuth } from '../../_lib/auth.js';

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
    const unauthorized = await requireAuth(request, env);
    if (unauthorized) return unauthorized;

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

    return json({ message: '新增成功', course: { ...created, selected_count: 0 } }, { status: 201 });
  } catch (error) {
    return json({ error: error.message }, { status: 500 });
  }
}
