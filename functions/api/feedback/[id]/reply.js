import { json, requireDb } from '../../../_lib/db.js';
import { authenticatedAccount } from '../../../_lib/auth.js';
import { addReply, getFeedbackWithReplies } from '../../../_lib/feedback.js';
import { getClientIp, writeErrorLog, writeSystemLog } from '../../../_lib/systemLogs.js';
import { loginUser } from '../../../_lib/accounts.js';

export async function onRequestPost({ request, env, params }) {
  const db = requireDb(env);
  try {
    const admin = await authenticatedAccount(request, env);
    if (!admin) return json({ error: '未授权' }, { status: 401 });

    const feedbackId = parseInt(params.id, 10);
    if (!feedbackId) return json({ error: '无效的反馈ID' }, { status: 400 });

    const fb = await getFeedbackWithReplies(db, feedbackId);
    if (!fb) return json({ error: '反馈不存在' }, { status: 404 });

    const body = await request.json();
    const content = String(body.content || '').trim();
    if (!content) return json({ error: '请输入回复内容' }, { status: 400 });
    if (content.length > 2000) return json({ error: '回复内容不能超过2000字' }, { status: 400 });

    const ip = getClientIp(request);
    await addReply(db, {
      feedbackId,
      adminUsername: admin.username,
      adminName: loginUser(admin).displayName || admin.username,
      content,
      ip,
    });

    await writeSystemLog(db, {
      level: 'success',
      category: 'feedback',
      message: `回复了学生 ${fb.student_name} 的反馈: ${fb.title}`,
      actor: admin.username,
      targetId: String(feedbackId),
    }, request);

    const updated = await getFeedbackWithReplies(db, feedbackId);
    return json({ success: true, data: updated });
  } catch (error) {
    await writeErrorLog(db, error, { message: '回复反馈失败', category: 'feedback', ip: getClientIp(request) });
    return json({ error: error.message }, { status: 500 });
  }
}
