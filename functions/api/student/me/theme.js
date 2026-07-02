import { ensureDatabase, json, readJson, requireDb } from '../../../_lib/db.js';
import { requireStudent } from '../../../_lib/auth.js';
import { validateThemeInput } from '../../../_lib/themes.js';
import { writeErrorLog, writeSystemLog } from '../../../_lib/systemLogs.js';

export async function onRequestPut({ request, env }) {
  try {
    const auth = await requireStudent(request, env);
    if (auth.response) return auth.response;

    const input = await readJson(request);
    const { theme, error } = validateThemeInput(input);
    if (error) return json({ error }, { status: 400 });

    const db = requireDb(env);
    await ensureDatabase(db);

    const updated = await db
      .prepare('UPDATE students SET theme = ? WHERE id = ? RETURNING id, name, theme')
      .bind(theme, auth.student.id)
      .first();

    await writeSystemLog(db, {
      level: 'success',
      category: 'student',
      message: `学生更换主题：${updated.id} ${updated.name}`,
      actor: updated.id,
    });

    return json({
      message: '主题已保存',
      user: {
        role: 'student',
        id: updated.id,
        username: updated.id,
        name: updated.name,
        theme: updated.theme,
      },
    });
  } catch (error) {
    try {
      const db = requireDb(env);
      await writeErrorLog(db, error, { message: '学生更换主题失败', category: 'student' });
    } catch {}

    return json({ error: error.message }, { status: 500 });
  }
}
