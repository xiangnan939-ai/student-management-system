import { json, requireDb } from '../../../_lib/db.js';
import { authenticatedAccount } from '../../../_lib/auth.js';
import { markFeedbackClosed, getFeedbackWithReplies } from '../../../_lib/feedback.js';
import { getClientIp, writeSystemLog } from '../../../_lib/systemLogs.js';

export async function onRequestPut({ request, env, params }) {
  const db = requireDb(env);
  try {
    const admin = await authenticatedAccount(request, env);
    if (!admin) return json({ error: '未授权' }, { status: 401 });

    const feedbackId = parseInt(params.id, 10);
    if (!feedbackId) return json({ error: '无效的反馈ID' }, { status: 400 });

    const fb = await getFeedbackWithReplies(db, feedbackId);
    if (!fb) return json({ error: '反馈不存在' }, { status: 404 });

    await markFeedbackClosed(db, feedbackId);

    await writeSystemLog(db, {
      level: 'info',
      category: 'feedback',
      message: `关闭了反馈: ${fb.title}`,
      actor: admin.username,
      targetId: String(feedbackId),
    }, request);

    return json({ success: true });
  } catch (error) {
    return json({ error: error.message }, { status: 500 });
  }
}
