import { json, requireDb } from '../../_lib/db.js';
import { authenticatedAccount, authenticatedStudent } from '../../_lib/auth.js';
import { countPendingFeedback, countUnreadReplies } from '../../_lib/feedback.js';

export async function onRequestGet({ request, env }) {
  const db = requireDb(env);
  try {
    const admin = await authenticatedAccount(request, env);
    if (admin) {
      const pending = await countPendingFeedback(db);
      return json({ pending });
    }
    const student = await authenticatedStudent(request, env);
    if (student) {
      const unread = await countUnreadReplies(db, String(student.id));
      return json({ unread });
    }
    return json({ error: '未授权' }, { status: 401 });
  } catch (error) {
    return json({ error: error.message }, { status: 500 });
  }
}
