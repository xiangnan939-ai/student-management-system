const express = require('express');
const cors = require('cors');
const db = require('./db');
const { Worker } = require('worker_threads');
const path = require('path');
const Mutex = require('./mutex');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// 全局互斥锁，保护数据库写入
const dbMutex = new Mutex();
// 保存所有的 SSE 客户端
let sseClients = [];

// 将日志通过 SSE 推送给前端
function sendLogToClients(threadName, action, message) {
    const data = JSON.stringify({ threadName, action, message, timestamp: new Date().toLocaleTimeString() });
    sseClients.forEach(client => client.write(`data: ${data}\n\n`));
}

// SSE 连接接口
app.get('/api/stream-logs', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    sseClients.push(res);
    req.on('close', () => {
        sseClients = sseClients.filter(client => client !== res);
    });
});

// 启动多线程并发测试接口
app.post('/api/start-concurrent-test', (req, res) => {
    const { useMutex = true } = req.body || {};
    res.json({ message: '并发测试已启动', useMutex });

    const workers = [
        { name: '校本部线程', prefix: 'M', count: 10 },
        { name: '东校区线程', prefix: 'E', count: 10 },
        { name: '西校区线程', prefix: 'W', count: 10 }
    ];

    sendLogToClients('System', 'info', `====== 多线程并发测试开始 ======`);
    sendLogToClients('System', 'info', `互斥锁(Mutex)状态: ${useMutex ? '开启 (安全执行)' : '关闭 (高危！无锁竞争)'}`);

    workers.forEach(wConf => {
        const worker = new Worker(path.resolve(__dirname, 'worker.js'), {
            workerData: { threadName: wConf.name, prefix: wConf.prefix, count: wConf.count }
        });

        worker.on('message', async (msg) => {
            if (msg.type === 'log') {
                sendLogToClients(wConf.name, 'info', msg.message);
            } 
            else if (msg.type === 'write_request') {
                const { threadName, student, progress } = msg;
                
                sendLogToClients(threadName, 'wait', `第 ${progress} 条数据请求写入...`);
                
                let lockAcquired = false;

                if (useMutex) {
                    await dbMutex.acquire();
                    lockAcquired = true;
                    sendLogToClients(threadName, 'lock', `成功获取锁，正在写入...`);
                } else {
                    sendLogToClients(threadName, 'warning', `警告：无锁状态下直接强行写入临界区！`);
                }

                try {
                    await new Promise((resolve, reject) => {
                        db.run("INSERT INTO students (id, name, gender, age, major, phone) VALUES (?, ?, ?, ?, ?, ?)",
                            [student.id, student.name, student.gender, student.age, student.major, student.phone],
                            function(err) {
                                if (err) reject(err);
                                else resolve();
                            }
                        );
                    });
                    
                    // 为了演示效果稍微延迟
                    await new Promise(r => setTimeout(r, 100));
                    sendLogToClients(threadName, 'success', `写入完成.`);
                } catch (err) {
                    sendLogToClients(threadName, 'error', `写入崩溃: ${err.message}`);
                } finally {
                    if (lockAcquired) {
                        sendLogToClients(threadName, 'unlock', `释放锁.`);
                        dbMutex.release();
                    }
                }
            }
            else if (msg.type === 'done') {
                sendLogToClients(wConf.name, 'info', `该线程全部任务执行完毕！`);
            }
        });

        worker.on('error', (err) => sendLogToClients(wConf.name, 'error', `线程错误: ${err.message}`));
    });
});

// --- 原有的 CRUD 接口保持不变 ---

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (username === 'admin' && password === '123456') {
        res.json({ success: true, token: 'mock-jwt-token', user: { name: '管理员' } });
    } else {
        res.status(401).json({ success: false, message: '用户名或密码错误' });
    }
});

app.get('/api/stats', (req, res) => {
    const stats = {};
    db.get('SELECT COUNT(*) as total FROM students', (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        stats.totalStudents = row.total;
        db.all('SELECT gender, COUNT(*) as count FROM students GROUP BY gender', (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            stats.genderDistribution = rows;
            db.all('SELECT major, COUNT(*) as count FROM students GROUP BY major', (err, rows) => {
                if (err) return res.status(500).json({ error: err.message });
                stats.majorDistribution = rows;
                res.json(stats);
            });
        });
    });
});

app.get('/api/students', (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const keyword = req.query.keyword || '';

    const searchQuery = `%${keyword}%`;
    const sqlCount = `SELECT COUNT(*) as count FROM students WHERE id LIKE ? OR name LIKE ?`;
    const sqlData = `SELECT * FROM students WHERE id LIKE ? OR name LIKE ? ORDER BY id DESC LIMIT ? OFFSET ?`;

    db.get(sqlCount, [searchQuery, searchQuery], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        const total = row.count;
        db.all(sqlData, [searchQuery, searchQuery, limit, offset], (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ data: rows, total: total, page: page, totalPages: Math.ceil(total / limit) });
        });
    });
});

app.post('/api/students', (req, res) => {
    const { id, name, gender, age, major, phone } = req.body;
    db.run("INSERT INTO students (id, name, gender, age, major, phone) VALUES (?, ?, ?, ?, ?, ?)",
        [id, name, gender, age, major, phone],
        function(err) {
            if (err) return res.status(err.message.includes('UNIQUE') ? 409 : 500).json({ error: err.message });
            res.status(201).json({ message: '新增成功', id: id });
        }
    );
});

app.put('/api/students/:originalId', (req, res) => {
    const { originalId } = req.params;
    const { id, name, gender, age, major, phone } = req.body;
    db.run(`UPDATE students SET id = ?, name = ?, gender = ?, age = ?, major = ?, phone = ? WHERE id = ?`,
        [id, name, gender, age, major, phone, originalId],
        function(err) {
            if (err) return res.status(err.message.includes('UNIQUE') ? 409 : 500).json({ error: err.message });
            res.json({ message: '更新成功' });
        }
    );
});

app.delete('/api/students/:id', (req, res) => {
    db.run("DELETE FROM students WHERE id = ?", req.params.id, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: '删除成功' });
    });
});

// 静态托管 React 编译后的前端产物
app.use(express.static(path.join(__dirname, 'public')));

// 所有非 API 请求都返回 index.html，交给 React Router 处理前端路由
app.use((req, res, next) => {
    if (!req.url.startsWith('/api')) {
        res.sendFile(path.join(__dirname, 'public/index.html'));
    } else {
        res.status(404).json({ error: 'API route not found' });
    }
});

const { exec } = require('child_process');

function startServer(port) {
    const server = app.listen(port, '127.0.0.1', () => {
        console.log(`Backend server running at http://127.0.0.1:${port}`);
        console.log(`正在自动打开浏览器... http://127.0.0.1:${port}`);
        // 自动打开浏览器
        const url = `http://127.0.0.1:${port}`;
        if (process.platform === 'win32') {
            exec(`start ${url}`);
        } else if (process.platform === 'darwin') {
            exec(`open ${url}`);
        } else {
            exec(`xdg-open ${url}`);
        }
    });

    server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.log(`端口 ${port} 被占用，尝试端口 ${port + 1}...`);
            startServer(port + 1);
        } else {
            console.error('服务器启动失败:', err);
            setTimeout(() => process.exit(1), 10000); // 等待10秒以便用户查看报错
        }
    });
}

startServer(PORT);
