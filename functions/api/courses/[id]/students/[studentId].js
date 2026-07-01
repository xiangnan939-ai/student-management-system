import { ensureCourseStore, json, requireDb } from '../../../../_lib/db.js';
import { requireUser } from '../../../../_lib/auth.js';
import { writeErrorLog, writeSystemLog } from '../../../../_lib/systemLogs.js';

export async function onRequestDelete({ request, env, params }) {
  try {
    const auth = await requireUser(request, env);
    if (auth.response) return auth.response;

    const db = requireDb(env);
    await ensureCourseStore(db);

    const course = await db
      .prepare('SELECT id, name FROM courses WHERE id = ?')
      .bind(params.id)
      .first();
    if (!course) return json({ error: '课程不存在' }, { status: 404 });

    const student = await db
      .prepare('SELECT id, name FROM students WHERE id = ?')
      .bind(params.studentId)
      .first();
    if (!student) return json({ error: '学生不存在' }, { status: 404 });

    const result = await db
      .prepare('DELETE FROM student_courses WHERE course_id = ? AND student_id = ?')
      .bind(params.id, params.studentId)
      .run();

    if (!result.meta?.changes) {
      return json({ error: '该学生未选择这门课程' }, { status: 404 });
    }

    await writeSystemLog(db, {
      level: 'warning',
      category: 'course-selection',
      message: `管理员撤销选课：${student.id} ${student.name} / ${course.name}`,
      actor: auth.account.username,
    });

    return json({ message: '撤销成功' });
  } catch (error) {
    try {
      const db = requireDb(env);
      await writeErrorLog(db, error, { message: '管理员撤销学生选课失败', category: 'course-selection' });
    } catch {}

    return json({ error: error.message }, { status: 500 });
  }
}
