import { json, requireDb } from '../../../../_lib/db.js';
import { requireStudent } from '../../../../_lib/auth.js';
import { markFeedbackReadByStudent } from '../../../../_lib/feedback.js';

export async function onRequestPut({ request, env, params }) {
  const db = requireDb(env);
  try {
    const auth = await requireStudent(request, env);
    if (auth.response) return auth.response;

    const feedbackId = parseInt(params.id, 10);
    if (!feedbackId) return json({ error: '无效的反馈ID' }, { status: 400 });

    await markFeedbackReadByStudent(db, String(auth.student.id), feedbackId);
    return json({ success: true });
  } catch (error) {
    return json({ error: error.message }, { status: 500 });
  }
}
