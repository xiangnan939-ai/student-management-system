import { ensureDatabase, json, readJson, requireDb, validateStudent } from '../../_lib/db.js';
import { requireUser } from '../../_lib/auth.js';
import { writeErrorLog, writeSystemLog } from '../../_lib/systemLogs.js';

export async function onRequestGet({ request, env }) {
  try {
    const db = requireDb(env);
    await ensureDatabase(db);

    const url = new URL(request.url);
    const page = Math.max(Number.parseInt(url.searchParams.get('page') || '1', 10), 1);
    const limit = Math.min(Math.max(Number.parseInt(url.searchParams.get('limit') || '10', 10), 1), 100);
    const offset = (page - 1) * limit;
    const keyword = url.searchParams.get('keyword') || '';
    const search = `%${keyword}%`;

    const total = await db
      .prepare('SELECT COUNT(*) AS count FROM students WHERE id LIKE ? OR name LIKE ?')
      .bind(search, search)
      .first();

    const rows = await db
      .prepare(`
        SELECT id, name, gender, age, major, phone
        FROM students
        WHERE id LIKE ? OR name LIKE ?
        ORDER BY id DESC
        LIMIT ? OFFSET ?
      `)
      .bind(search, search, limit, offset)
      .all();

    const count = total?.count || 0;
    return json({
      data: rows.results || [],
      total: count,
      page,
      totalPages: Math.max(Math.ceil(count / limit), 1),
    });
  } catch (error) {
    return json({ error: error.message }, { status: 500 });
  }
}

export async function onRequestPost({ request, env }) {
  try {
    const auth = await requireUser(request, env);
    if (auth.response) return auth.response;

    const db = requireDb(env);
    await ensureDatabase(db);

    const input = await readJson(request);
    const { student, error } = validateStudent(input);
    if (error) return json({ error }, { status: 400 });

    await db
      .prepare('INSERT INTO students (id, name, gender, age, major, phone) VALUES (?, ?, ?, ?, ?, ?)')
      .bind(student.id, student.name, student.gender, student.age, student.major, student.phone)
      .run();

    await writeSystemLog(db, {
      level: 'success',
      category: 'student',
      message: `新增学生档案：${student.id} ${student.name}`,
      actor: auth.account.username,
    });

    return json({ message: '新增成功', id: student.id }, { status: 201 });
  } catch (error) {
    try {
      const db = requireDb(env);
      await writeErrorLog(db, error, { message: '新增学生档案失败', category: 'student' });
    } catch {}

    const status = String(error.message).includes('UNIQUE') ? 409 : 500;
    return json({ error: error.message }, { status });
  }
}
