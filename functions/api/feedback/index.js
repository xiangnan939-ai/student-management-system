import { json, requireDb } from '../../_lib/db.js';
import { requireAuth, requireStudent, authenticatedAccount, authenticatedStudent } from '../../_lib/auth.js';
import { createFeedback, listAllFeedback, countPendingFeedback } from '../../_lib/feedback.js';
import { getClientIp, writeErrorLog, writeSystemLog } from '../../_lib/systemLogs.js';

const FEEDBACK_TYPES = new Set(['feedback', 'question', 'bug', 'suggestion']);

export async function onRequestGet({ request, env }) {
  const db = requireDb(env);
  try {
    const admin = await authenticatedAccount(request, env);
    if (!admin) return json({ error: '未授权' }, { status: 401 });

    const url = new URL(request.url);
    const status = url.searchParams.get('status') || '';
    const feedbacks = await listAllFeedback(db, { status });
    const pending = await countPendingFeedback(db);
    return json({ data: feedbacks, pending });
  } catch (error) {
    await writeErrorLog(db, error, { message: '获取反馈列表失败', category: 'feedback', ip: getClientIp(request) });
    return json({ error: error.message }, { status: 500 });
  }
}

export async function onRequestPost({ request, env }) {
  const db = requireDb(env);
  try {
    const auth = await requireStudent(request, env);
    if (auth.response) return auth.response;

    const body = await request.json();
    const type = FEEDBACK_TYPES.has(body.type) ? body.type : 'feedback';
    const title = String(body.title || '').trim();
    const content = String(body.content || '').trim();

    if (!title) return json({ error: '请填写反馈标题' }, { status: 400 });
    if (!content) return json({ error: '请填写反馈内容' }, { status: 400 });
    if (content.length > 2000) return json({ error: '反馈内容不能超过2000字' }, { status: 400 });
    if (title.length > 100) return json({ error: '标题不能超过100字' }, { status: 400 });

    const ip = getClientIp(request);
    const feedbackId = await createFeedback(db, {
      studentId: String(auth.student.id),
      studentName: auth.student.name,
      type,
      title,
      content,
      ip,
    });

    await writeSystemLog(db, {
      level: 'info',
      category: 'feedback',
      message: `学生 ${auth.student.name} 提交了反馈: ${title}`,
      actor: String(auth.student.id),
      targetId: String(feedbackId),
    }, request);

    return json({ success: true, id: feedbackId });
  } catch (error) {
    await writeErrorLog(db, error, { message: '学生提交反馈失败', category: 'feedback', ip: getClientIp(request) });
    return json({ error: error.message }, { status: 500 });
  }
}
