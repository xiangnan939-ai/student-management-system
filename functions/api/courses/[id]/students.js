import { ensureCourseStore, json, requireDb } from '../../../_lib/db.js';
import { requireAuth } from '../../../_lib/auth.js';

export async function onRequestGet({ request, env, params }) {
  try {
    const unauthorized = await requireAuth(request, env);
    if (unauthorized) return unauthorized;

    const db = requireDb(env);
    await ensureCourseStore(db);

    const course = await db
      .prepare('SELECT id, name FROM courses WHERE id = ?')
      .bind(params.id)
      .first();

    if (!course) return json({ error: '课程不存在' }, { status: 404 });

    const rows = await db
      .prepare(`
        SELECT
          s.id,
          s.name,
          s.gender,
          s.age,
          s.major,
          s.phone,
          sc.created_at AS selected_at
        FROM student_courses sc
        JOIN students s ON s.id = sc.student_id
        WHERE sc.course_id = ?
        ORDER BY sc.created_at DESC, s.id ASC
      `)
      .bind(params.id)
      .all();

    return json({
      course,
      data: rows.results || [],
    });
  } catch (error) {
    return json({ error: error.message }, { status: 500 });
  }
}
