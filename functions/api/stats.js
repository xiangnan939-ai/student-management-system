import { ensureDatabase, json, requireDb } from '../_lib/db.js';

export async function onRequestGet({ env }) {
  try {
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
