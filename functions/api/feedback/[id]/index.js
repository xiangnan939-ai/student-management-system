import { json, requireDb } from '../../../_lib/db.js';
import { authenticatedAccount } from '../../../_lib/auth.js';
import { deleteFeedback, getFeedbackWithReplies } from '../../../_lib/feedback.js';
import { getClientIp, writeErrorLog, writeSystemLog } from '../../../_lib/systemLogs.js';

export async function onRequestDelete({ request, env, params }) {
  const db = requireDb(env);
  try {
    const admin = await authenticatedAccount(request, env);
    if (!admin) return json({ error: '未授权' }, { status: 401 });

    const feedbackId = parseInt(params.id, 10);
    if (!feedbackId) return json({ error: '无效的反馈ID' }, { status: 400 });

    const fb = await getFeedbackWithReplies(db, feedbackId);
    if (!fb) return json({ error: '反馈不存在' }, { status: 404 });

    await deleteFeedback(db, feedbackId);

    await writeSystemLog(db, {
      level: 'warning',
      category: 'feedback',
      message: `删除了学生 ${fb.student_name} 的反馈: ${fb.title}`,
      actor: admin.username,
      targetId: String(feedbackId),
    }, request);

    return json({ success: true });
  } catch (error) {
    await writeErrorLog(db, error, { message: '删除反馈失败', category: 'feedback', ip: getClientIp(request) });
    return json({ error: error.message }, { status: 500 });
  }
}
