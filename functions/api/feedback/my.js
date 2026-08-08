import { json, requireDb } from '../../_lib/db.js';
import { requireStudent } from '../../_lib/auth.js';
import { listStudentFeedback, countUnreadReplies } from '../../_lib/feedback.js';
import { getClientIp, writeErrorLog } from '../../_lib/systemLogs.js';

export async function onRequestGet({ request, env }) {
  const db = requireDb(env);
  try {
    const auth = await requireStudent(request, env);
    if (auth.response) return auth.response;
    const feedbacks = await listStudentFeedback(db, String(auth.student.id));
    const unread = await countUnreadReplies(db, String(auth.student.id));
    return json({ data: feedbacks, unread });
  } catch (error) {
    await writeErrorLog(db, error, { message: '学生获取反馈列表失败', category: 'feedback', ip: getClientIp(request) });
    return json({ error: error.message }, { status: 500 });
  }
}
