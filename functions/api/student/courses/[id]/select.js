import { ensureCourseStore, json, requireDb } from '../../../../_lib/db.js';
import { requireStudent } from '../../../../_lib/auth.js';
import { writeErrorLog, writeSystemLog } from '../../../../_lib/systemLogs.js';

export async function onRequestPost({ request, env, params }) {
  try {
    const auth = await requireStudent(request, env);
    if (auth.response) return auth.response;

    const db = requireDb(env);
    await ensureCourseStore(db);

    const course = await db
      .prepare('SELECT id, capacity FROM courses WHERE id = ?')
      .bind(params.id)
      .first();

    if (!course) return json({ error: '课程不存在' }, { status: 404 });

    const existing = await db
      .prepare('SELECT id FROM student_courses WHERE student_id = ? AND course_id = ?')
      .bind(auth.student.id, params.id)
      .first();

    if (existing) return json({ message: '已选该课程' });

    const selected = await db
      .prepare('SELECT COUNT(*) AS count FROM student_courses WHERE course_id = ?')
      .bind(params.id)
      .first();

    if (Number(selected?.count || 0) >= Number(course.capacity)) {
      return json({ error: '该课程名额已满' }, { status: 400 });
    }

    await db
      .prepare('INSERT INTO student_courses (student_id, course_id) VALUES (?, ?)')
      .bind(auth.student.id, params.id)
      .run();

    await writeSystemLog(db, {
      level: 'success',
      category: 'course-selection',
      message: `学生选课：${auth.student.id} 选择课程 ${params.id}`,
      actor: auth.student.id,
    });

    return json({ message: '选课成功' }, { status: 201 });
  } catch (error) {
    try {
      const db = requireDb(env);
      await writeErrorLog(db, error, { message: '学生选课失败', category: 'course-selection' });
    } catch {}

    const message = String(error.message || '');
    const status = message.includes('UNIQUE') ? 409 : 500;
    return json({ error: status === 409 ? '已选该课程' : error.message }, { status });
  }
}

export async function onRequestDelete({ request, env, params }) {
  try {
    const auth = await requireStudent(request, env);
    if (auth.response) return auth.response;

    const db = requireDb(env);
    await ensureCourseStore(db);

    await db
      .prepare('DELETE FROM student_courses WHERE student_id = ? AND course_id = ?')
      .bind(auth.student.id, params.id)
      .run();

    await writeSystemLog(db, {
      level: 'warning',
      category: 'course-selection',
      message: `学生退选：${auth.student.id} 退选课程 ${params.id}`,
      actor: auth.student.id,
    });

    return json({ message: '退选成功' });
  } catch (error) {
    try {
      const db = requireDb(env);
      await writeErrorLog(db, error, { message: '学生退选失败', category: 'course-selection' });
    } catch {}

    return json({ error: error.message }, { status: 500 });
  }
}
