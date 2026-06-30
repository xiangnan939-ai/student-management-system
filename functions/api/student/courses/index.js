import { ensureCourseStore, json, requireDb } from '../../../_lib/db.js';
import { requireStudent } from '../../../_lib/auth.js';

export async function onRequestGet({ request, env }) {
  try {
    const auth = await requireStudent(request, env);
    if (auth.response) return auth.response;

    const db = requireDb(env);
    await ensureCourseStore(db);

    const rows = await db
      .prepare(`
        SELECT
          c.id,
          c.name,
          c.teacher,
          c.time,
          c.location,
          c.credit,
          c.capacity,
          c.description,
          c.created_at,
          c.updated_at,
          COUNT(all_sc.id) AS selected_count,
          CASE WHEN mine.id IS NULL THEN 0 ELSE 1 END AS selected
        FROM courses c
        LEFT JOIN student_courses all_sc ON all_sc.course_id = c.id
        LEFT JOIN student_courses mine ON mine.course_id = c.id AND mine.student_id = ?
        GROUP BY c.id
        ORDER BY c.id DESC
      `)
      .bind(auth.student.id)
      .all();

    return json({ data: rows.results || [] });
  } catch (error) {
    return json({ error: error.message }, { status: 500 });
  }
}
