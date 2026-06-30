const { parentPort, workerData } = require('worker_threads');

const { threadName, count, prefix } = workerData;

parentPort.postMessage({ type: 'log', message: `[${threadName}] 线程启动，准备生成 ${count} 条记录...` });

// 模拟生成数据
for (let i = 1; i <= count; i++) {
    // 模拟一段耗时计算，增加并发抢占的随机性
    let delay = 0;
    for(let j = 0; j < 5000000; j++) { delay += j; }

    const student = {
        id: `${prefix}${Date.now().toString().slice(-4)}${i}`,
        name: `${threadName}号_${i}`,
        gender: i % 2 === 0 ? '女' : '男',
        age: 18 + (i % 5),
        major: '多线程并发测试专业',
        phone: `138000${i}`.padEnd(11, '0')
    };

    // 发送给主线程请求数据库写入
    parentPort.postMessage({ type: 'write_request', threadName, student, progress: i });
}

parentPort.postMessage({ type: 'done', threadName });
