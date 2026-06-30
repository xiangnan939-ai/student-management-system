import { json } from '../_lib/db.js';

export async function onRequestGet() {
  return json({
    message: 'Cloudflare Pages 版本不使用常驻 SSE，请调用 POST /api/start-concurrent-test 获取演示日志。',
  });
}
