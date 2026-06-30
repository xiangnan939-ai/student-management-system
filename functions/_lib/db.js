const seedStudents = [
  ['2023001', '张三', '男', 20, '计算机科学与技术', '13800138001'],
  ['2023002', '李四', '女', 19, '软件工程', '13800138002'],
  ['2023003', '王五', '男', 21, '人工智能', '13800138003'],
  ['2023004', '赵六', '女', 20, '信息安全', '13800138004'],
  ['2023005', '钱七', '男', 22, '物联网工程', '13800138005'],
  ['2023006', '周八', '女', 19, '计算机科学与技术', '13800138006'],
  ['2023007', '吴九', '男', 20, '人工智能', '13800138007'],
  ['2023008', '郑十', '女', 21, '软件工程', '13800138008'],
];

export function json(data, init = {}) {
  return Response.json(data, {
    ...init,
    headers: {
      'Cache-Control': 'no-store',
      ...(init.headers || {}),
    },
  });
}

export async function readJson(request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

export async function ensureDatabase(db) {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS students (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      gender TEXT NOT NULL,
      age INTEGER NOT NULL,
      major TEXT NOT NULL,
      phone TEXT,
      password TEXT NOT NULL DEFAULT '123456',
      password_changed_at TEXT
    )
  `).run();

  const columns = await db.prepare('PRAGMA table_info(students)').all();
  const columnNames = new Set((columns.results || []).map((column) => column.name));

  if (!columnNames.has('password')) {
    await db.prepare("ALTER TABLE students ADD COLUMN password TEXT NOT NULL DEFAULT '123456'").run();
  }

  if (!columnNames.has('password_changed_at')) {
    await db.prepare('ALTER TABLE students ADD COLUMN password_changed_at TEXT').run();
  }

  const row = await db.prepare('SELECT COUNT(*) AS count FROM students').first();
  if (row?.count > 0) return;

  const statement = db.prepare(`
    INSERT INTO students (id, name, gender, age, major, phone)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  await db.batch(seedStudents.map((student) => statement.bind(...student)));
}

export function requireDb(env) {
  if (!env.DB) {
    throw new Error('Cloudflare D1 binding DB is not configured.');
  }
  return env.DB;
}

export function validateStudent(input) {
  const id = String(input.id || '').trim();
  const name = String(input.name || '').trim();
  const gender = String(input.gender || '男').trim();
  const age = Number.parseInt(input.age, 10);
  const major = String(input.major || '').trim();
  const phone = String(input.phone || '').trim();

  if (!id || !name || !major || !Number.isInteger(age)) {
    return { error: '学号、姓名、年龄和专业不能为空' };
  }

  if (!['男', '女'].includes(gender)) {
    return { error: '性别只能是 男 或 女' };
  }

  if (age < 1 || age > 120) {
    return { error: '年龄范围不合法' };
  }

  return { student: { id, name, gender, age, major, phone } };
}

export function validateCourse(input) {
  const name = String(input.name || '').trim();
  const teacher = String(input.teacher || '').trim();
  const time = String(input.time || '').trim();
  const location = String(input.location || '').trim();
  const credit = Number.parseFloat(input.credit);
  const capacity = Number.parseInt(input.capacity, 10);
  const description = String(input.description || '').trim();

  if (!name || !teacher || !time || !location) {
    return { error: '课程名称、任课教师、上课时间和地点不能为空' };
  }

  if (!Number.isFinite(credit) || credit <= 0 || credit > 20) {
    return { error: '学分范围不合法' };
  }

  if (!Number.isInteger(capacity) || capacity < 1 || capacity > 10000) {
    return { error: '人数上限范围不合法' };
  }

  return { course: { name, teacher, time, location, credit, capacity, description } };
}

export async function ensureCourseStore(db) {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      teacher TEXT NOT NULL,
      time TEXT NOT NULL,
      location TEXT NOT NULL,
      credit REAL NOT NULL,
      capacity INTEGER NOT NULL,
      description TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

  await db.prepare(`
    CREATE TABLE IF NOT EXISTS student_courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id TEXT NOT NULL,
      course_id INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(student_id, course_id)
    )
  `).run();
}

export async function listCoursesWithCounts(db) {
  await ensureCourseStore(db);

  const rows = await db.prepare(`
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
      COUNT(sc.id) AS selected_count
    FROM courses c
    LEFT JOIN student_courses sc ON sc.course_id = c.id
    GROUP BY c.id
    ORDER BY c.id DESC
  `).all();

  return rows.results || [];
}
