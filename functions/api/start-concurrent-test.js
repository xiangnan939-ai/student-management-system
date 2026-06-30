import { ensureDatabase, json, readJson, requireDb } from '../_lib/db.js';
import { requireAuth } from '../_lib/auth.js';

function log(threadName, action, message) {
  return {
    threadName,
    action,
    message,
    timestamp: new Date().toLocaleTimeString('zh-CN', { hour12: false }),
  };
}

function createStudent(prefix, threadName, index) {
  const random = crypto.randomUUID().slice(0, 6).toUpperCase();
  return {
    id: `${prefix}${random}${index}`,
    name: `${threadName}号_${index}`,
    gender: index % 2 === 0 ? '女' : '男',
    age: 18 + (index % 5),
    major: '多线程并发测试专业',
    phone: `138000${index}`.padEnd(11, '0'),
  };
}

export async function onRequestPost({ request, env }) {
  try {
    const unauthorized = requireAuth(request, env);
    if (unauthorized) return unauthorized;

    const db = requireDb(env);
    await ensureDatabase(db);

    const { useMutex = true } = await readJson(request);
    const workers = [
      { name: '校本部线程', prefix: 'M', count: 5 },
      { name: '东校区线程', prefix: 'E', count: 5 },
      { name: '西校区线程', prefix: 'W', count: 5 },
    ];

    const logs = [
      log('System', 'info', '====== Cloudflare 并发写入演示开始 ======'),
      log('System', 'info', `互斥锁(Mutex)状态: ${useMutex ? '开启 (按队列安全写入)' : '关闭 (模拟无锁竞争)'}`),
    ];

    const insert = db.prepare(`
      INSERT INTO students (id, name, gender, age, major, phone)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const writes = [];

    for (const worker of workers) {
      logs.push(log(worker.name, 'info', `[${worker.name}] 任务启动，准备生成 ${worker.count} 条记录...`));
      for (let i = 1; i <= worker.count; i += 1) {
        const student = createStudent(worker.prefix, worker.name, i);
        logs.push(log(worker.name, 'wait', `第 ${i} 条数据请求写入...`));
        logs.push(log(worker.name, useMutex ? 'lock' : 'warning', useMutex ? '成功获取锁，正在写入...' : '无锁模式：模拟直接进入临界区。'));
        writes.push(insert.bind(student.id, student.name, student.gender, student.age, student.major, student.phone));
        logs.push(log(worker.name, 'success', '写入完成.'));
        if (useMutex) logs.push(log(worker.name, 'unlock', '释放锁.'));
      }
      logs.push(log(worker.name, 'info', '该线程全部任务执行完毕！'));
    }

    await db.batch(writes);
    logs.push(log('System', 'success', '====== 并发写入演示完成 ======'));

    return json({ message: '并发测试已完成', useMutex, logs });
  } catch (error) {
    return json({ error: error.message }, { status: 500 });
  }
}
