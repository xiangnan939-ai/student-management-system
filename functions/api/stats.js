import { ensureDatabase, json, requireDb } from '../_lib/db.js';
import { requireAnyAuth } from '../_lib/auth.js';

export async function onRequestGet({ request, env }) {
  try {
    const auth = await requireAnyAuth(request, env);
    if (auth.response) return auth.response;

    const db = requireDb(env);
    await ensureDatabase(db);

    const total = await db.prepare('SELECT COUNT(*) AS total FROM students').first();
    const genderDistribution = await db
      .prepare('SELECT gender, COUNT(*) AS count FROM students GROUP BY gender ORDER BY gender')
      .all();
    const majorDistribution = await db
      .prepare('SELECT major, COUNT(*) AS count FROM students GROUP BY major ORDER BY count DESC, major')
      .all();

    return json({
      totalStudents: total?.total || 0,
      genderDistribution: genderDistribution.results || [],
      majorDistribution: majorDistribution.results || [],
    });
  } catch (error) {
    return json({ error: error.message }, { status: 500 });
  }
}
